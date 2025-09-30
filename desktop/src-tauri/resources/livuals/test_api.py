#!/usr/bin/env python3
import requests
import json
import sys

def test_api():
    """
    Prueba la conexión a la API de shaders
    """
    print("\n===== PRUEBA DE API DE SHADERS =====\n")
    
    # URLs a probar
    urls = [
        "http://localhost:7860/api/shaders/list",
        "http://127.0.0.1:7860/api/shaders/list",
        "http://localhost:5000/api/shaders/list",
        "http://127.0.0.1:5000/api/shaders/list"
    ]
    
    success = False
    
    for url in urls:
        print(f"Probando URL: {url}")
        try:
            response = requests.get(url, timeout=5)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                print("  Respuesta exitosa!")
                try:
                    data = response.json()
                    print(f"  Datos: {json.dumps(data, indent=2)}")
                    success = True
                except json.JSONDecodeError:
                    print(f"  Error al decodificar JSON: {response.text[:100]}...")
            else:
                print(f"  Error: {response.status_code} - {response.reason}")
        except requests.exceptions.RequestException as e:
            print(f"  Error de conexión: {e}")
        
        print()
    
    if not success:
        print("No se pudo conectar a ninguna URL de la API")
    
    print("===== FIN DE PRUEBA DE API =====\n")

if __name__ == "__main__":
    test_api()
