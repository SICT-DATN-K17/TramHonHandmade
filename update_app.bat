@echo off
set /p module="Nhap ten module can update: "

echo ===================================================
echo [1/2] Updating module: %module%... 
echo ===================================================
docker exec -u root -it tramhon_odoo16 odoo -u %module% -d tramhon_odoo_db --db_host=db --db_user=odoo --db_password=odoo --stop-after-init

echo.
echo ===================================================
echo [2/2] Restarting Docker
echo ===================================================
docker restart tramhon_odoo16
