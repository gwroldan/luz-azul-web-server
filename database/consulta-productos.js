const sql = require('mssql');
const config = require('./config-db');

const pool = new sql.ConnectionPool(config);
const conn = pool.connect();

const queryStock = `WITH ArbolClasif (id, nombre, idpadre, level, sort)
                AS 
                (
                    SELECT cp.ClasificacionProdId, CAST(cp.Descripcion AS VARCHAR(100)), 0, 0 as level, CAST(cp.Descripcion AS VARCHAR (100)) as sort
                    FROM ClasificacionesProductos cp 
                    WHERE cp.ClasificacionProdId IN (121,122,139) --Realizar Pedidos, Pizzas y Picadas
                    UNION ALL
                    SELECT cp.ClasificacionProdId, CAST(REPLICATE('|---', level + 1) + cp.Descripcion as varchar(100)), rac.ClasifProdIdPadre, level+1,
                        CAST (sort + ' \\\\ ' + cp.Descripcion AS VARCHAR (100)) as sort
                    FROM ClasificacionesProductos cp
                    JOIN RelArbolClasifProductos rac ON rac.ClasifProdIdHijo = cp.ClasificacionProdId
                    JOIN ArbolClasif ac ON rac.ClasifProdIdPadre = ac.id
                )
                SELECT r.ListaPrecioId listaPrecioId, p.ProductoId productoId, p.Descripcion descProducto, ROUND(r.Precio * (1 + (p.IVA/100)),2) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                JOIN RelProductosClasificacionesProductos rpcp ON rpcp.ProductoId = p.ProductoId
                JOIN ArbolClasif ac ON ac.id = rpcp.ClasificacionProdId
                JOIN ClasificacionesProductos cp ON cp.ClasificacionProdId = ac.id
                WHERE cp.Descripcion NOT LIKE ('%Papelera%') AND p.Inactivo=0 AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT r.ListaPrecioId listaPrecioId, p.ProductoId productoId, p.Descripcion descProducto, ROUND(r.Precio * (1 + (p.IVA/100)),2) precio    
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('814','833','842','843') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '836' productoId, 'Promo Tarta' descProducto, 
                    SUM(CASE
                        WHEN p.ProductoId = '146' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.300, 2)
                        WHEN p.ProductoId = '835' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.500, 2)
                        WHEN p.ProductoId = '836' THEN ROUND((r.Precio * (1 + (p.IVA/100))), 2)
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('146','835','836') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '844' productoId, 'Promo Jamon' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '809' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.250, 2)
                        WHEN p.ProductoId = '844' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.200, 2)        
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('809','844') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '845' productoId, 'Promo Salame' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '809' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.250, 2)
                        WHEN p.ProductoId = '845' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.150, 2)        
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('809','845') AND r.ListaPrecioId = @input_parameter                
                UNION
                SELECT 1 listaPrecioId, p.ProductoId productoId, 'Promo Picnic' descProducto, ROUND((r.Precio/2) * (1 + (p.IVA/100)),2) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId='854' AND r.ListaPrecioId = @input_parameter
                OPTION (maxrecursion 0)`;

exports.getData = function getData(listaPrecioId) {
    return conn.then(conexion => {
        let listaPrecios;

        return conexion.request()
            .input('input_parameter', sql.Int, listaPrecioId)
            .query(queryStock)
            .then( result => {
                listaPrecios = result.recordset;

                return listaPrecios;
            })
            .catch(err => {
                return err;
            });

    }).catch((err) => {
        console.log(err);
    });;
}

