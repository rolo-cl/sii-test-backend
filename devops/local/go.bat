@echo off
REM Levanta la aplicacion completa (BFF + frontend) con Docker Compose.
REM Equivalente para Windows de devops/local/go.sh.
REM Requisitos: Docker Desktop y el repo sii-test-frontend clonado junto a este.

REM Se ubica en la raiz del repositorio para funcionar desde cualquier carpeta (o con doble clic).
cd /d "%~dp0..\.."

docker compose ps
docker compose down
docker compose ps
docker compose up -d --build frontend

echo.
echo App:     http://localhost:8080
echo Swagger: http://localhost:3000/api/docs
echo Mostrando logs del BFF (Ctrl+C para salir; la app sigue corriendo)...
echo.
docker compose logs -f backend
