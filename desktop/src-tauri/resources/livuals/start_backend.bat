@echo off
echo Iniciando el servidor backend para los shaders...

:: Verificar si Python está instalado
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python no está instalado o no está en el PATH.
    echo Por favor, instale Python y asegúrese de que está en el PATH.
    pause
    exit /b 1
)

:: Verificar si Flask y Flask-CORS están instalados
python -c "import flask, flask_cors" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Instalando dependencias necesarias...
    pip install Flask==2.3.3 Flask-CORS==4.0.0
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar las dependencias.
        pause
        exit /b 1
    )
)

:: Verificar si existe el directorio de shaders
if not exist "public\shaders" (
    echo Advertencia: El directorio de shaders no existe.
    echo Creando directorio...
    mkdir "public\shaders"
)

:: Iniciar el servidor
echo Iniciando servidor en http://localhost:5000
python app.py

pause
