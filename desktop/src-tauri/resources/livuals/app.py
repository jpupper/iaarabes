import os
import json
import traceback
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

app = Flask(__name__)
# Configurar CORS para permitir solicitudes desde cualquier origen
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": "*"}})

# Path to the shaders directory
SHADERS_DIR = os.path.join(os.path.dirname(__file__), "public", "shaders")

@app.route('/api/shaders', methods=['GET', 'OPTIONS'])
def get_shaders():
    """
    Returns a list of all shader files in the shaders directory
    """
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        shaders = []
        
        # Verificar si el directorio existe
        if not os.path.exists(SHADERS_DIR):
            print(f"Directorio de shaders no encontrado: {SHADERS_DIR}")
            return jsonify([]), 404
        
        # Get all .frag files in the shaders directory
        for filename in os.listdir(SHADERS_DIR):
            if filename.endswith('.frag'):
                shader_id = os.path.splitext(filename)[0]  # Remove extension
                shader_name = shader_id.capitalize()  # Simple name transformation
                
                shaders.append({
                    'id': shader_id,
                    'name': f'Patrón {shader_name}',
                    'file': shader_id
                })
        
        return jsonify(shaders)
    except Exception as e:
        print(f"Error al obtener la lista de shaders: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/shaders/<shader_id>', methods=['GET', 'OPTIONS'])
def get_shader_content(shader_id):
    """
    Returns the content of a specific shader file
    """
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Sanitizar el ID del shader para evitar ataques de path traversal
        if '/' in shader_id or '\\' in shader_id or '..' in shader_id:
            return jsonify({'error': 'Invalid shader ID'}), 400
            
        # Check if the shader exists
        frag_path = os.path.join(SHADERS_DIR, f"{shader_id}.frag")
        if not os.path.exists(frag_path):
            print(f"Shader no encontrado: {frag_path}")
            return jsonify({'error': 'Shader not found'}), 404
        
        # Get the vertex shader (assuming it's the same for all fragment shaders)
        vert_path = os.path.join(SHADERS_DIR, "vertex.vert")
        if not os.path.exists(vert_path):
            print(f"Vertex shader no encontrado: {vert_path}")
            # Usar un vertex shader por defecto si no existe el archivo
            vertex_shader = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}"
        else:
            # Read the vertex shader
            with open(vert_path, 'r') as f:
                vertex_shader = f.read()
        
        # Read the fragment shader
        with open(frag_path, 'r') as f:
            fragment_shader = f.read()
        
        return jsonify({
            'fragmentShaderSource': fragment_shader,
            'vertexShaderSource': vertex_shader
        })
    except Exception as e:
        print(f"Error al obtener el shader {shader_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.after_request
def add_cors_headers(response):
    """Agregar encabezados CORS a todas las respuestas"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    print(f"Servidor iniciado. Directorio de shaders: {SHADERS_DIR}")
    print(f"Shaders disponibles: {[f for f in os.listdir(SHADERS_DIR) if f.endswith('.frag')]}")
    app.run(debug=True, port=5000, host='0.0.0.0')
