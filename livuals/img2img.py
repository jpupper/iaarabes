import sys
import os
import platform

sys.path.append(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "StreamDiffusion"
    )
)

from utils.wrapper import StreamDiffusionWrapper

# Verificar si estamos en Windows para importar PySpout
IS_WINDOWS = platform.system() == 'Windows'
if IS_WINDOWS:
    try:
        from PySpout import SpoutSender
        from OpenGL.GL import GL_RGBA
        SPOUT_AVAILABLE = True
    except ImportError:
        print("PySpout no está disponible, la salida Spout estará desactivada")
        SPOUT_AVAILABLE = False
else:
    print("Sistema no Windows detectado, la salida Spout estará desactivada")
    SPOUT_AVAILABLE = False

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
        self.current_params = params
        
        # Inicializar Spout solo en Windows
        self.spout_sender = None
        self.spout_width = params.width
        self.spout_height = params.height
        self.initialize_spout()

        # Inicializar StreamDiffusion
        self.inicializar_streamdiffusion(params)
        
    def inicializar_streamdiffusion(self, params):
        """Inicializa o reinicializa StreamDiffusion con los parámetros actuales"""
        if self.device.type == "cuda":
            # Usar StreamDiffusion solo en CUDA para evitar dependencias CUDA en CPU/MPS
            self.stream = StreamDiffusionWrapper(
                model_id_or_path=base_model,
                use_tiny_vae=self.args.taesd,
                device=self.device,
                dtype=self.torch_dtype,
                t_index_list=self.steps_config.t_index_list,
                frame_buffer_size=1,
                width=params.width,
                height=params.height,
                use_lcm_lora=False,
                output_type="pil",
                warmup=10,
                vae_id=None,
                acceleration=self.args.acceleration,
                mode="img2img",
                use_denoising_batch=True,
                cfg_type="none",
                use_safety_checker=self.args.safety_checker,
                engine_dir=self.args.engine_dir,
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
                torch_dtype=self.torch_dtype,
                safety_checker=None if not self.args.safety_checker else None,
            )
            self._diffusers_pipe.to(self.device)
            self.ready = True
            
    def reiniciar_streamdiffusion(self, params):
        """Reinicia StreamDiffusion con nuevos parámetros y actualiza Spout si es necesario"""
        # Guardar estado anterior
        old_width = self.spout_width
        old_height = self.spout_height
        
        # Actualizar dimensiones con los valores actuales de los sliders
        self.spout_width = params.width
        self.spout_height = params.height
        self.current_params = params
        
        # Verificar si cambió la resolución
        resolucion_cambiada = (old_width != self.spout_width) or (old_height != self.spout_height)
        
        if resolucion_cambiada:
            print(f"Resolución cambiada de {old_width}x{old_height} a {self.spout_width}x{self.spout_height}")
            
            # Reinicializar Spout con las nuevas dimensiones
            self.initialize_spout()
            
            # Reinicializar StreamDiffusion con las nuevas dimensiones
            if hasattr(self, 'stream'):
                print("Reinicializando StreamDiffusion con nueva resolución...")
                self.inicializar_streamdiffusion(params)
            
        return resolucion_cambiada

    def initialize_spout(self):
        """Inicializa el emisor Spout con las dimensiones actuales
        Si ya existe un SpoutSender, verifica si la resolución cambió.
        Si cambió, libera el anterior y crea uno nuevo.
        """
        if not SPOUT_AVAILABLE:
            return
            
        try:
            # Verificar si ya existe un SpoutSender y si la resolución cambió
            if self.spout_sender is not None:
                # Si la resolución es la misma, mantener el SpoutSender existente
                if hasattr(self, 'spout_width_current') and hasattr(self, 'spout_height_current') and \
                   self.spout_width == self.spout_width_current and self.spout_height == self.spout_height_current:
                    print(f"Manteniendo SpoutSender existente con resolución {self.spout_width}x{self.spout_height}")
                    return
                    
                # Si la resolución cambió, liberar el SpoutSender existente
                print(f"Resolución cambiada de {getattr(self, 'spout_width_current', 'N/A')}x{getattr(self, 'spout_height_current', 'N/A')} a {self.spout_width}x{self.spout_height}")
                print("Liberando SpoutSender anterior...")
                self.spout_sender.release()
                self.spout_sender = None
            
            # Inicializar Spout con las dimensiones actuales
            print(f"Inicializando SpoutSender con resolución {self.spout_width}x{self.spout_height}")
            self.spout_sender = SpoutSender("LivualsOutput", self.spout_width, self.spout_height, GL_RGBA)
            
            # Guardar la resolución actual para futuras comparaciones
            self.spout_width_current = self.spout_width
            self.spout_height_current = self.spout_height
            
        except Exception as e:
            print(f"Warning: Could not initialize Spout: {e}")
            self.spout_sender = None
    
    def sendSpout(self, image):
        """Enviar imagen a Spout"""
        # Si no estamos en Windows o Spout no está disponible, no hacer nada
        if not SPOUT_AVAILABLE or self.spout_sender is None:
            return
            
        if not isinstance(image, Image.Image):
            return
            
        # Hacer una copia para Spout para no modificar la original
        spout_image = image.copy()
        
        # Asegurar el tamaño correcto
        if spout_image.size != (self.spout_width, self.spout_height):
            spout_image = spout_image.resize((self.spout_width, self.spout_height))
        
        # Convertir a array numpy
        img_array = np.array(spout_image)
        
        # Crear array BGRA
        bgra = np.zeros((self.spout_height, self.spout_width, 4), dtype=np.int32)
        
        # Reordenar canales RGB -> BGR y asignar alpha
        bgra[..., 2] = img_array[..., 2]  # B
        bgra[..., 1] = img_array[..., 1]  # G
        bgra[..., 0] = img_array[..., 0]  # R
        bgra[..., 3] = 255              # Alpha opaco
        
        # Enviar a Spout sin flip
        self.spout_sender.send_image(bgra, False)
        
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
            
            # Verificar si la resolución o los parámetros han cambiado
            resolucion_cambiada = False
            if hasattr(self, 'current_params'):
                if (self.current_params.width != params.width or 
                    self.current_params.height != params.height):
                    # La resolución cambió, reiniciar StreamDiffusion y Spout
                    resolucion_cambiada = self.reiniciar_streamdiffusion(params)
                elif self.current_params.steps != params.steps:
                    # Solo actualizamos los parámetros actuales
                    self.current_params = params
            else:
                self.current_params = params
            
            # Normal processing first
            if hasattr(self, "stream") and self.device.type == "cuda":
                image_tensor = self.stream.preprocess_image(params.image)
                if isinstance(image_tensor, torch.Tensor):
                    # Ajustar brillo en el tensor de entrada
                    image_tensor = torch.clamp(image_tensor * 1.8, 0, 1)
                    image_tensor *=2.+.2;
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
            
            # Enviar a Spout si está disponible, estamos en Windows y está habilitado
            if SPOUT_AVAILABLE and self.spout_sender is not None and getattr(params, 'enableSpout', True):
                try:
                    self.sendSpout(current_output)
                except Exception as e:
                    print(f"Warning: Failed to send to Spout: {e}")
            
            return current_output
            
        finally:
            self.busy = False
