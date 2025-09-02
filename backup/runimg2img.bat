@echo off
cd StreamDiffusion
call .\venv\Scripts\activate.bat
cd demo\realtime-img2img
python main.py
cmd /k
