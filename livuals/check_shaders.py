#!/usr/bin/env python3
import os
import sys

def check_shaders():
    """
    Verifica la existencia y el contenido de la carpeta de shaders
    """
    print("\n===== VERIFICACIÓN DE SHADERS =====\n")
    
    # Rutas posibles para la carpeta de shaders
    current_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [
        os.path.join(current_dir, "public", "shaders"),
        os.path.abspath(os.path.join(current_dir, "..", "public", "shaders"))
    ]
    
    print(f"Directorio actual: {current_dir}\n")
    print("Rutas a verificar:")
    for i, path in enumerate(paths):
        print(f"{i+1}. {path}")
    print()
    
    found = False
    
    for path in paths:
        print(f"Verificando: {path}")
        if os.path.exists(path):
            print(f"[OK] La carpeta existe")
            if os.path.isdir(path):
                print(f"[OK] Es un directorio")
                files = os.listdir(path)
                print(f"Contenido ({len(files)} archivos):")
                
                frag_files = []
                vert_files = []
                other_files = []
                
                for file in files:
                    full_path = os.path.join(path, file)
                    if file.endswith(".frag"):
                        frag_files.append(file)
                    elif file.endswith(".vert"):
                        vert_files.append(file)
                    else:
                        other_files.append(file)
                
                if frag_files:
                    print(f"\nArchivos .frag ({len(frag_files)}):")
                    for file in sorted(frag_files):
                        size = os.path.getsize(os.path.join(path, file))
                        print(f"  - {file} ({size} bytes)")
                else:
                    print("[ERROR] No se encontraron archivos .frag")
                
                if vert_files:
                    print(f"\nArchivos .vert ({len(vert_files)}):")
                    for file in sorted(vert_files):
                        size = os.path.getsize(os.path.join(path, file))
                        print(f"  - {file} ({size} bytes)")
                else:
                    print("[ERROR] No se encontró el archivo vertex.vert")
                
                if other_files:
                    print(f"\nOtros archivos ({len(other_files)}):")
                    for file in sorted(other_files):
                        print(f"  - {file}")
                
                found = True
            else:
                print(f"[ERROR] No es un directorio")
        else:
            print(f"[ERROR] La carpeta no existe")
        print()
    
    if not found:
        print("[ERROR] No se encontró ninguna carpeta de shaders válida")
        print("Creando carpeta de shaders en:", paths[0])
        os.makedirs(paths[0], exist_ok=True)
        
        # Crear un archivo vertex.vert básico
        vert_path = os.path.join(paths[0], "vertex.vert")
        with open(vert_path, "w") as f:
            f.write("attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}")
        
        # Crear un archivo frag básico
        frag_path = os.path.join(paths[0], "default.frag")
        with open(frag_path, "w") as f:
            f.write("""precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    gl_FragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
}""")
        
        print("[OK] Carpeta de shaders creada con archivos básicos")
    
    print("\n===== FIN DE LA VERIFICACIÓN =====\n")

if __name__ == "__main__":
    check_shaders()
