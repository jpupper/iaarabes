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
from PySpout import SpoutSender
from OpenGL.GL import GL_RGBA

import torch
import numpy as np

from config import Args
from pydantic import BaseModel, Field
from PIL import Image
from typing import Optional, List, Dict, Any

class StepsConfig:
    def __init__(self, total_steps: int = 50):
        self.total_steps = total_steps
        self._base_t1 = 35
        self._base_t2 = 45
        self._base_total = 50
    
    @property
    def t_index_list(self) -> List[int]:
        t1 = int((self._base_t1 * self.total_steps) / self._base_total)
        t2 = int((self._base_t2 * self.total_steps) / self._base_total)
        return [t1, t2]

try:
    from diffusers import AutoPipelineForImage2Image
except Exception:
    AutoPipelineForImage2Image = None  # type: ignore
import math

base_model = "stabilityai/sd-turbo"
taesd_model = "madebyollin/taesd"

default_prompt = "Portrait of The Joker halloween costume, face painting, with , glare pose, detailed, intricate, full of colour, cinematic lighting, trending on artstation, 8k, hyperrealistic, focused, extreme details, unreal engine 5 cinematic, masterpiece"
default_negative_prompt = "black and white, blurry, low resolution, pixelated,  pixel art, low quality, low fidelity"

page_content = """<p id="page_content">VJING using AI</p>"""


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
            min=10,
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
        self.steps_config = StepsConfig(params.steps)
        self.last_valid_image = None
        self.in_transition = False
        self.transition_progress = 0.0
        self.old_steps_config = None
        self.transition_frames = 10
        
        # Inicializar Spout
        try:
            # Asegurar que las dimensiones sean correctas para Spout
            self.spout_width = params.width
            self.spout_height = params.height
            print(f"[Spout Debug] Initializing Spout with size: {self.spout_width}x{self.spout_height}")
            # Asegurar que las dimensiones sean múltiplos de 2 para compatibilidad
            self.spout_width = (self.spout_width + 1) & ~1
            self.spout_height = (self.spout_height + 1) & ~1
            print(f"[Spout Debug] Adjusted size to: {self.spout_width}x{self.spout_height}")
            self.spout_sender = SpoutSender("LivualsOutput", self.spout_width, self.spout_height, GL_RGBA)
        except Exception as e:
            print(f"Warning: Could not initialize Spout: {e}")
            self.spout_sender = None

        if device.type == "cuda":
            # Usar StreamDiffusion solo en CUDA para evitar dependencias CUDA en CPU/MPS
            self.stream = StreamDiffusionWrapper(
                model_id_or_path=base_model,
                use_tiny_vae=args.taesd,
                device=device,
                dtype=torch_dtype,
                t_index_list=self.steps_config.t_index_list,
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
                num_inference_steps=self.steps_config.total_steps,
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

    def blend_frames(self, frame1, frame2, alpha):
        """Blend two frames using alpha blending"""
        try:
            # Convert to numpy arrays first
            if isinstance(frame1, Image.Image):
                frame1 = np.array(frame1)
            if isinstance(frame2, Image.Image):
                frame2 = np.array(frame2)
            
            # Ensure both are float32 for blending
            frame1 = frame1.astype(np.float32)
            frame2 = frame2.astype(np.float32)
            
            # Do the blend in numpy
            blended = frame1 * (1 - alpha) + frame2 * alpha
            blended = np.clip(blended, 0, 255).astype(np.uint8)
            
            return Image.fromarray(blended)
        except Exception as e:
            print(f"Blend error: {e}")
            return frame2 if alpha > 0.5 else frame1

    def predict(self, params: "Pipeline.InputParams") -> Image.Image:
        self.busy = True
        try:
            current_output = None
            
            # Normal processing first
            if hasattr(self, "stream") and self.device.type == "cuda":
                image_tensor = self.stream.preprocess_image(params.image)
                if isinstance(image_tensor, torch.Tensor):
                    image_tensor = torch.clamp(image_tensor, 0, 1)
                current_output = self.stream(image=image_tensor, prompt=params.prompt)
            else:
                assert self._diffusers_pipe is not None
                img = params.image
                if img.width != params.width or img.height != params.height:
                    img = img.resize((params.width, params.height), Image.BICUBIC)
                current_output = self._diffusers_pipe(
                    prompt=params.prompt,
                    image=img,
                    num_inference_steps=int(params.steps),
                    guidance_scale=1.2,
                ).images[0]

            # Check if steps changed
            if params.steps != self.steps_config.total_steps:
                if not self.in_transition and self.last_valid_image is not None:
                    self.in_transition = True
                    self.transition_progress = 0.0
                    self.old_steps_config = self.steps_config
                    self.steps_config = StepsConfig(params.steps)
                    
                    if hasattr(self, "stream"):
                        self.stream.t_list = self.steps_config.t_index_list
                        self.stream.denoising_steps_num = len(self.steps_config.t_index_list)
                        self.stream.prepare(
                            prompt=params.prompt,
                            negative_prompt=default_negative_prompt,
                            num_inference_steps=self.steps_config.total_steps,
                            guidance_scale=1.2
                        )

            # Handle transition if active
            if self.in_transition and self.last_valid_image is not None:
                alpha = self.transition_progress / self.transition_frames
                output_image = self.blend_frames(self.last_valid_image, current_output, alpha)
                
                self.transition_progress += 1
                if self.transition_progress >= self.transition_frames:
                    self.in_transition = False
                    self.transition_progress = 0.0
                    self.last_valid_image = current_output
                    return current_output
                
                return output_image
            
            # Store last valid image and send to Spout if available
            self.last_valid_image = current_output
            
            # Enviar a Spout si está disponible
            if self.spout_sender is not None:
                try:
                    # Convertir la imagen PIL a numpy array
                    if isinstance(current_output, Image.Image):
                        print(f"[Spout Debug] Original image size: {current_output.size}, mode: {current_output.mode}")
                        
                        # Hacer una copia para Spout para no modificar la original
                        spout_image = current_output.copy()
                        
                        # Primero asegurar el tamaño correcto
                        if spout_image.size != (self.spout_width, self.spout_height):
                            spout_image = spout_image.resize((self.spout_width, self.spout_height))
                            print(f"[Spout Debug] Resized to: {spout_image.size}")
                        
                        # Convertir a RGBA si es necesario
                        if spout_image.mode != 'RGBA':
                            spout_image = spout_image.convert('RGBA')
                            print(f"[Spout Debug] Converted to mode: {spout_image.mode}")
                        
                        # Convertir a array numpy y reordenar canales a BGRA
                        img_array = np.array(spout_image)
                        print(f"[Spout Debug] Numpy array shape: {img_array.shape}, dtype: {img_array.dtype}")
                        
                        # Reordenar de RGBA a BGRA
                        img_array = img_array[:, :, [2,1,0,3]]
                        
                        # Convertir a int32 para Spout
                        img_array = img_array.astype(np.int32)
                        print(f"[Spout Debug] Final array shape: {img_array.shape}, dtype: {img_array.dtype}")
                        
                        # Intentar enviar a Spout con flip=False
                        success = self.spout_sender.send_image(img_array, False)
                        print(f"[Spout Debug] Send result: {success}")
                except Exception as e:
                    print(f"Warning: Failed to send to Spout: {e}")
            
            return current_output
            
        finally:
            self.busy = False
