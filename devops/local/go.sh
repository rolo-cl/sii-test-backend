docker compose ps
docker compose down               # detener y eliminar los contenedores
docker compose ps                 # estado de los contenedores
docker compose up -d --build frontend   # reconstruir solo un servicio tras un cambio
docker compose logs -f backend    # logs del BFF