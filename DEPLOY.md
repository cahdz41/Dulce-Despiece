# Deploy automático a Vercel

## Configuración inicial (solo una vez por PC)

Ejecuta este comando en la terminal para guardar el token de GitHub.
Reemplaza `TU_TOKEN` con el token real.

```powershell
git remote set-url origin https://TU_TOKEN@github.com/cahdz41/Dulce-Despiece.git
```

Después de esto, todos los pushes futuros no pedirán contraseña.

---

## Flujo normal de deploy

```powershell
cd "c:\Users\laptop\vs code\despiece dulce\glass-optimizer"
git add .
git commit -m "descripción del cambio"
git push origin main
```

Vercel detecta el push automáticamente y despliega en 1-2 minutos.

---

## Variable de entorno en Vercel (obligatoria)

La API key de Gemini **no se sube al repo** (está en `.gitignore`).
Debes agregarla manualmente en el dashboard de Vercel:

1. Ir a [vercel.com](https://vercel.com) → tu proyecto → **Settings → Environment Variables**
2. Agregar:
   - **Nombre:** `VITE_GEMINI_API_KEY`
   - **Valor:** tu API key de Google Cloud Console
3. Hacer un redeploy si el proyecto ya estaba desplegado antes de agregar la variable

---

## Obtener o renovar el token de GitHub

1. Ir a GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Generar nuevo token con scope **`repo`**
3. Volver a ejecutar el comando de configuración inicial con el nuevo token

---

## Verificar que el remote está configurado correctamente

```powershell
git remote -v
```

Debe mostrar:
```
origin  https://<token>@github.com/cahdz41/Dulce-Despiece.git (fetch)
origin  https://<token>@github.com/cahdz41/Dulce-Despiece.git (push)
```
