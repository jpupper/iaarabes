from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request, UploadFile, File, Form

import markdown2

import logging
import uuid
import time
from types import SimpleNamespace
import asyncio
import os
import time
import mimetypes
import json
import torch
import os

from config import config, Args
from util import pil_to_frame, bytes_to_pil
from io import BytesIO
from connection_manager import ConnectionManager, ServerFullException
from img2img import Pipeline

# fix mime error on windows
mimetypes.add_type("application/javascript", ".js")

THROTTLE = 1.0 / 120
# logging.basicConfig(level=logging.DEBUG)


class App:
    def __init__(self, config: Args, pipeline):
        self.args = config
        self.pipeline = pipeline
        self.app = FastAPI()
        self.conn_manager = ConnectionManager()
        self.init_app()

    def init_app(self):
        class NoCacheStaticFiles(StaticFiles):
            async def get_response(self, path, scope):
                response = await super().get_response(path, scope)
                response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
                return response
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @self.app.websocket("/api/ws/{user_id}")
        async def websocket_endpoint(user_id: uuid.UUID, websocket: WebSocket):
            try:
                await self.conn_manager.connect(
                    user_id, websocket, self.args.max_queue_size
                )
                await handle_websocket_data(user_id)
            except ServerFullException as e:
                logging.error(f"Server Full: {e}")
            finally:
                await self.conn_manager.disconnect(user_id)
                logging.info(f"User disconnected: {user_id}")

        async def handle_websocket_data(user_id: uuid.UUID):
            if not self.conn_manager.check_user(user_id):
                return HTTPException(status_code=404, detail="User not found")
            last_time = time.time()
            try:
                while True:
                    if (
                        self.args.timeout > 0
                        and time.time() - last_time > self.args.timeout
                    ):
                        await self.conn_manager.send_json(
                            user_id,
                            {
                                "status": "timeout",
                                "message": "Your session has ended",
                            },
                        )
                        await self.conn_manager.disconnect(user_id)
                        return
                    data = await self.conn_manager.receive_json(user_id)
                    if not data:
                        # client likely disconnected
                        return
                    if data.get("status") == "next_frame":
                        info = pipeline.Info()
                        params = await self.conn_manager.receive_json(user_id)
                        if not params:
                            return
                        params = pipeline.InputParams(**params)
                        params = SimpleNamespace(**params.dict())
                        if info.input_mode == "image":
                            image_data = await self.conn_manager.receive_bytes(user_id)
                            if len(image_data) == 0:
                                await self.conn_manager.send_json(
                                    user_id, {"status": "send_frame"}
                                )
                                continue
                            params.image = bytes_to_pil(image_data)
                        await self.conn_manager.update_data(user_id, params)

            except Exception as e:
                logging.error(f"Websocket Error: {e}, {user_id} ")
                await self.conn_manager.disconnect(user_id)

        @self.app.get("/api/queue")
        async def get_queue_size():
            queue_size = self.conn_manager.get_user_count()
            return JSONResponse({"queue_size": queue_size})

        @self.app.get("/api/stream/{user_id}")
        async def stream(user_id: uuid.UUID, request: Request):
            try:

                async def generate():
                    while True:
                        last_time = time.time()
                        await self.conn_manager.send_json(
                            user_id, {"status": "send_frame"}
                        )
                        params = await self.conn_manager.get_latest_data(user_id)
                        if params is None:
                            continue
                        await self.conn_manager.send_json(user_id, {"status": "inference_start"})
                        try:
                            image = pipeline.predict(params)
                            if image is None:
                                continue
                            frame = pil_to_frame(image)
                            logging.info(f"Yielding frame: {len(frame)} bytes to {user_id}")
                            yield frame
                        except Exception as e:
                            logging.error(f"Prediction Error: {e}")
                            # Inform UI clearly and stop stream
                            await self.conn_manager.send_json(
                                user_id,
                                {"status": "error", "message": f"Prediction failed: {str(e)}"},
                            )
                            break
                        finally:
                            await self.conn_manager.send_json(
                                user_id,
                                {
                                    "status": "inference_end",
                                    "took": round(time.time() - last_time, 3),
                                },
                            )
                        if self.args.debug:
                            print(f"Time taken: {time.time() - last_time}")

                return StreamingResponse(
                    generate(),
                    media_type="multipart/x-mixed-replace;boundary=frame",
                    headers={"Cache-Control": "no-cache"},
                )
            except Exception as e:
                logging.error(f"Streaming Error: {e}, {user_id} ")
                return HTTPException(status_code=404, detail="User not found")

        # route to setup frontend
        @self.app.get("/api/settings")
        async def settings():
            info_schema = pipeline.Info.schema()
            info = pipeline.Info()
            if info.page_content:
                page_content = markdown2.markdown(info.page_content)

            input_params = pipeline.InputParams.schema()
            build_id = os.environ.get("LIVUALS_BUILD_ID", "dev")
            return JSONResponse(
                {
                    "info": info_schema,
                    "input_params": input_params,
                    "max_queue_size": self.args.max_queue_size,
                    "page_content": page_content if info.page_content else "",
                    "runtime": {
                        "device": str(device),
                        "dtype": str(torch_dtype),
                        "acceleration": self.args.acceleration,
                        "cuda": torch.cuda.is_available(),
                        "mps": hasattr(torch.backends, "mps") and torch.backends.mps.is_available(),
                        "ready": getattr(pipeline, "ready", True),
                        "busy": getattr(pipeline, "busy", False),
                        "build_id": build_id,
                    },
                }
            )

        @self.app.get("/api/status")
        async def status():
            return JSONResponse(
                {
                    "ready": getattr(pipeline, "ready", True),
                    "busy": getattr(pipeline, "busy", False),
                }
            )

        @self.app.post("/api/snapshot")
        async def snapshot(params: str = Form(...), image: UploadFile = File(None)):
            try:
                info = pipeline.Info()
                params_dict = json.loads(params) if isinstance(params, str) else params
                schema_params = pipeline.InputParams(**params_dict)
                p = SimpleNamespace(**schema_params.dict())
                if info.input_mode == "image":
                    if image is None:
                        raise HTTPException(status_code=400, detail="image required for image mode")
                    data = await image.read()
                    p.image = bytes_to_pil(data)
                img = pipeline.predict(p)
                buf = BytesIO()
                img.save(buf, format="JPEG")
                content = buf.getvalue()
                headers = {"Content-Disposition": "attachment; filename=livuals_snapshot.jpg"}
                return Response(content=content, media_type="image/jpeg", headers=headers)
            except Exception as e:
                logging.error(f"Snapshot Error: {e}")
                return HTTPException(status_code=500, detail=str(e))

        if not os.path.exists("public"):
            os.makedirs("public")

        self.app.mount(
            "/", NoCacheStaticFiles(directory="./frontend/public", html=True), name="public"
        )


if torch.cuda.is_available():
    device = torch.device("cuda")
    torch_dtype = torch.float16
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = torch.device("mps")
    torch_dtype = torch.float16
else:
    device = torch.device("cpu")
    torch_dtype = torch.float32
pipeline = Pipeline(config, device, torch_dtype)
app = App(config, pipeline).app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
        ssl_certfile=config.ssl_certfile,
        ssl_keyfile=config.ssl_keyfile,
    )
