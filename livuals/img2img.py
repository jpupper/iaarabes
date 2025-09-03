import sys
import os

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "StreamDiffusion"
    )
)

from utils.wrapper import StreamDiffusionWrapper

import torch

from config import Args
from pydantic import BaseModel, Field
from PIL import Image
from typing import Optional
try:
    from diffusers import AutoPipelineForImage2Image
except Exception:
    AutoPipelineForImage2Image = None  # type: ignore
import math

base_model = "stabilityai/sd-turbo"
taesd_model = "madebyollin/taesd"

default_prompt = "Portrait of The Joker halloween costume, face painting, with , glare pose, detailed, intricate, full of colour, cinematic lighting, trending on artstation, 8k, hyperrealistic, focused, extreme details, unreal engine 5 cinematic, masterpiece"
default_negative_prompt = "black and white, blurry, low resolution, pixelated,  pixel art, low quality, low fidelity"

page_content = """<p>VJING using AI</p>
"""


class Pipeline:
    class Info(BaseModel):
        name: str = "StreamDiffusion img2img"
        input_mode: str = "image"
        page_content: str = page_content

    class InputParams(BaseModel):
        prompt: str = Field(
            default_prompt,
            title="Prompt",
            field="textarea",
            id="prompt",
        )
        # negative_prompt: str = Field(
        #     default_negative_prompt,
        #     title="Negative Prompt",
        #     field="textarea",
        #     id="negative_prompt",
        # )
        width: int = Field(
            384,
            min=256,
            max=512,
            step=64,
            title="Width",
            field="range",
            id="width",
            hide=False,
        )
        height: int = Field(
            384,
            min=256,
            max=512,
            step=64,
            title="Height",
            field="range",
            id="height",
            hide=False,
        )
        steps: int = Field(
            10,
            min=1,
            max=50,
            step=1,
            title="Steps",
            field="range",
            id="steps",
        )

    def __init__(self, args: Args, device: torch.device, torch_dtype: torch.dtype):
        params = self.InputParams()
        self.device = device
        self.torch_dtype = torch_dtype
        self.args = args
        self._diffusers_pipe = None  # type: Optional[AutoPipelineForImage2Image]
        self.ready: bool = False
        self.busy: bool = False

        if device.type == "cuda":
            # Usar StreamDiffusion solo en CUDA para evitar dependencias CUDA en CPU/MPS
            self.stream = StreamDiffusionWrapper(
                model_id_or_path=base_model,
                use_tiny_vae=args.taesd,
                device=device,
                dtype=torch_dtype,
                t_index_list=[35, 45],
                frame_buffer_size=1,
                width=params.width,
                height=params.height,
                use_lcm_lora=False,
                output_type="pil",
                warmup=10,
                vae_id=None,
                acceleration=args.acceleration,
                mode="img2img",
                use_denoising_batch=True,
                cfg_type="none",
                use_safety_checker=args.safety_checker,
                engine_dir=args.engine_dir,
            )
            self.last_prompt = default_prompt
            self.stream.prepare(
                prompt=default_prompt,
                negative_prompt=default_negative_prompt,
                num_inference_steps=50,
                guidance_scale=1.2,
            )
            self.ready = True
        else:
            # Fallback Diffusers para CPU/MPS
            if AutoPipelineForImage2Image is None:
                raise RuntimeError("diffusers no está disponible para el modo CPU/MPS")
            self._diffusers_pipe = AutoPipelineForImage2Image.from_pretrained(
                base_model,
                torch_dtype=torch_dtype,
                safety_checker=None if not args.safety_checker else None,
            )
            self._diffusers_pipe.to(device)
            self.ready = True

    def predict(self, params: "Pipeline.InputParams") -> Image.Image:
        self.busy = True
        try:
            if hasattr(self, "stream") and self.device.type == "cuda":
                image_tensor = self.stream.preprocess_image(params.image)
                output_image = self.stream(image=image_tensor, prompt=params.prompt)
                return output_image
            # CPU/MPS vía Diffusers
            assert self._diffusers_pipe is not None
            img = params.image
            # Ajustar tamaño si hace falta
            if img.width != params.width or img.height != params.height:
                img = img.resize((params.width, params.height), Image.BICUBIC)
            result = self._diffusers_pipe(
                prompt=params.prompt,
                image=img,
                num_inference_steps=int(params.steps),
                guidance_scale=1.2,
            )
            return result.images[0]
        finally:
            self.busy = False
