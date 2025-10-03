# Este archivo contiene las funciones para manejar shaders
# Se debe importar desde main.py

import os
import logging
from fastapi.responses import JSONResponse

def add_shader_routes(app):
    """
    Agrega rutas para manejar shaders al servidor FastAPI existente
    """
    
    @app.get("/api/shaders/list")
    async def list_shaders():
        """
        Lista todos los archivos de shader disponibles en public/shaders
        Similar a la función list_audio
        """
        try:
            exts = {'.frag'}
            # Intentar varias rutas posibles para encontrar los shaders
            base_dir = os.path.join(os.path.dirname(__file__), 'public', 'shaders')
            alt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'shaders'))
            
            print(f"\n\n==== BUSCANDO SHADERS ====\n")
            print(f"Directorio principal: {base_dir}")
            print(f"Directorio alternativo: {alt_dir}\n")
            
            # Verificar si los directorios existen
            if not os.path.isdir(base_dir):
                print(f"ADVERTENCIA: El directorio principal no existe: {base_dir}")
                if os.path.isdir(alt_dir):
                    print(f"Usando directorio alternativo: {alt_dir}")
                    base_dir = alt_dir
                else:
                    print(f"ADVERTENCIA: El directorio alternativo tampoco existe: {alt_dir}")
            
            items = []
            
            # Verificar si el directorio existe
            if not os.path.isdir(base_dir):
                logging.warning(f"Directorio de shaders no encontrado: {base_dir}")
                return JSONResponse([])
            
            # Obtener el archivo vertex.vert (común para todos los shaders)
            vert_path = os.path.join(base_dir, "vertex.vert")
            default_vertex = ""
            if os.path.exists(vert_path):
                with open(vert_path, 'r') as f:
                    default_vertex = f.read()
            
            # Listar todos los archivos .frag
            print(f"\n\n==== BUSCANDO SHADERS EN: {base_dir} ====\n")
            all_files = os.listdir(base_dir)
            print(f"Archivos encontrados: {all_files}\n")
            
            for filename in sorted(all_files):
                _, ext = os.path.splitext(filename)
                if ext.lower() not in exts:
                    print(f"Ignorando {filename} (extensión no válida)")
                    continue
                
                shader_id = os.path.splitext(filename)[0]
                shader_name = shader_id  # Use shader_id directly without capitalization
                
                print(f"Cargando shader: {shader_id} ({filename})")
                
                items.append({
                    'id': shader_id,
                    'name': shader_name,  # No prefix, just the shader name
                    'file': shader_id
                })
            
            print(f"\nTotal de shaders cargados: {len(items)}")
            print(f"Shaders disponibles: {[item['id'] for item in items]}\n==== FIN DE CARGA DE SHADERS ====\n\n")
            
            return JSONResponse(items)
        except Exception as e:
            logging.error(f"Error al listar shaders: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)
    
    @app.get("/api/shaders/{shader_id}")
    async def get_shader_content(shader_id: str):
        """
        Devuelve el contenido de un shader específico
        """
        try:
            # Sanitizar el ID del shader para evitar ataques de path traversal
            if '/' in shader_id or '\\' in shader_id or '..' in shader_id:
                return JSONResponse({"error": "Invalid shader ID"}, status_code=400)
            
            # Intentar varias rutas posibles para encontrar los shaders
            base_dir = os.path.join(os.path.dirname(__file__), 'public', 'shaders')
            alt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'shaders'))
            
            print(f"\n\n==== BUSCANDO SHADER: {shader_id} ====\n")
            print(f"Directorio principal: {base_dir}")
            print(f"Directorio alternativo: {alt_dir}\n")
            
            # Verificar si los directorios existen
            if not os.path.isdir(base_dir):
                print(f"ADVERTENCIA: El directorio principal no existe: {base_dir}")
                if os.path.isdir(alt_dir):
                    print(f"Usando directorio alternativo: {alt_dir}")
                    base_dir = alt_dir
                else:
                    print(f"ADVERTENCIA: El directorio alternativo tampoco existe: {alt_dir}")
            
            # Verificar si el directorio existe
            if not os.path.isdir(base_dir):
                logging.warning(f"Directorio de shaders no encontrado: {base_dir}")
                return JSONResponse({"error": "Shader directory not found"}, status_code=404)
            
            # Obtener el archivo fragment shader
            frag_path = os.path.join(base_dir, f"{shader_id}.frag")
            if not os.path.exists(frag_path):
                return JSONResponse({"error": "Shader not found"}, status_code=404)
            
            # Obtener el archivo vertex shader (común para todos)
            vert_path = os.path.join(base_dir, "vertex.vert")
            if not os.path.exists(vert_path):
                # Usar un vertex shader por defecto si no existe el archivo
                vertex_shader = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}"
            else:
                with open(vert_path, 'r') as f:
                    vertex_shader = f.read()
            
            # Leer el fragment shader
            with open(frag_path, 'r') as f:
                fragment_shader = f.read()
            
            return JSONResponse({
                "fragmentShaderSource": fragment_shader,
                "vertexShaderSource": vertex_shader
            })
        except Exception as e:
            logging.error(f"Error al obtener el shader {shader_id}: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)
