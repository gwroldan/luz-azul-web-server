const sql = require('mssql');
const config = require('./config-db');

const pool = new sql.ConnectionPool(config);
const conn = pool.connect();

const conSueldosExcluidos = "1001,20000,20002,20005";
const conSueldosExtrasExcluidos = "10,11,40,41,1001,20000,20002,20005";
const codClasifProvEmpleados = 32;
const nroDiaLimite = 20;
const codProdSueldos = 990081;

const querySueldos = `SELECT '(' + s.Legajo + ') ' + s.Nombre empleado, s.Neto sueldo, ISNULL(c.NetoCpras,0) sueldoCpras, 
	CASE 
	WHEN (s.Neto - ISNULL(c.NetoCpras,0)) = 0 THEN '0'
	WHEN (s.Neto - ISNULL(c.NetoCpras,0)) <> 0 THEN 'DIF ' + CONVERT(VARCHAR(10), ROUND((s.Neto - ISNULL(c.NetoCpras,0)), 2))
	END difSueldos,
	ROUND(sCalExtra.Neto * ISNULL(CASE 
		WHEN (p.WebSite='' OR p.WebSite IS NULL) THEN 0 
		ELSE CONVERT(money,p.WebSite) END ,0)/100, 2) extra, ISNULL(ce.NetoCpras,0) extraCpras,
	ROUND(sCalExtra.Neto * ISNULL(CASE 
		WHEN (p.WebSite='' OR p.WebSite IS NULL) THEN 0 
		ELSE CONVERT(money,p.WebSite) END ,0)/100, 2) - ISNULL(ce.NetoCpras,0) difExtra

	FROM (
    		SELECT ld.Legajo, le.Apellido + ', ' + le.Nombres Nombre, ROUND(SUM(ISNULL(ld.Haberes,0)) - SUM(ISNULL(ld.Descuentos,0)),2) Neto
    		FROM LiquidacionesDetalle ld
    		JOIN Liquidaciones l ON l.LiquidacionId=ld.LiquidacionId
    		LEFT JOIN Legajos le ON le.Legajo=ld.Legajo
                WHERE l.Mes = @mes AND l.Anio = @anio AND ld.ConceptoId NOT IN (${conSueldosExcluidos})
    		GROUP BY ld.Legajo, le.Apellido, le.Nombres) s
	JOIN Proveedores p ON p.Fax=s.Legajo
	JOIN (
		SELECT ld.Legajo, le.Apellido + ', ' + le.Nombres Nombre, ROUND(SUM(ISNULL(ld.Haberes,0)) - SUM(ISNULL(ld.Descuentos,0)),2) Neto
		FROM LiquidacionesDetalle ld
		JOIN Liquidaciones l ON l.LiquidacionId=ld.LiquidacionId
		LEFT JOIN Legajos le ON le.Legajo=ld.Legajo
		WHERE l.Mes = @mes AND l.Anio = @anio AND ld.ConceptoId NOT IN (${conSueldosExtrasExcluidos})
		GROUP BY ld.Legajo, le.Apellido, le.Nombres) sCalExtra ON sCalExtra.Legajo=s.Legajo
	LEFT JOIN (
    		SELECT p.Fax Legajo, p.RazonSocial, dd.CprasDocumentoId, CONVERT(Decimal(18,2),SUM(dd.Cantidad*dd.Unitario)) NetoCpras
    		FROM cprasDocumentosDetalle dd
    		JOIN cprasDocumentosCabecera dc ON dc.CprasDocumentoId=dd.CprasDocumentoId
    		JOIN RelProveedoresClasificacionesProveedores r ON r.ProveedorId=dc.ProveedorId
    		JOIN Proveedores p ON p.ProveedorId=r.ProveedorId
                WHERE r.ClasificacionProvId = ${codClasifProvEmpleados} AND DAY(dc.Fecha) > ${nroDiaLimite}
                AND MONTH(dc.Fecha) = @mes AND YEAR(dc.Fecha) = @anio AND dd.ProductoId='${codProdSueldos}'
		GROUP BY p.Fax, p.RazonSocial, dd.CprasDocumentoId) c ON c.Legajo=s.Legajo
	LEFT JOIN (
		SELECT p.Fax Legajo, p.RazonSocial, dd.CprasDocumentoId, CONVERT(Decimal(18,2),SUM(dd.Cantidad*dd.Unitario)) NetoCpras
    		FROM cprasDocumentosDetalle dd
    		JOIN cprasDocumentosCabecera dc ON dc.CprasDocumentoId=dd.CprasDocumentoId
    		JOIN RelProveedoresClasificacionesProveedores r ON r.ProveedorId=dc.ProveedorId
    		JOIN Proveedores p ON p.ProveedorId=r.ProveedorId
                WHERE r.ClasificacionProvId = ${codClasifProvEmpleados} AND DAY(dc.Fecha) < ${nroDiaLimite}
                AND MONTH(dc.Fecha) = (@mes + 1) AND YEAR(dc.Fecha) = @anio AND dd.ProductoId='${codProdSueldos}'
		GROUP BY p.Fax, p.RazonSocial, dd.CprasDocumentoId) ce ON ce.Legajo=s.Legajo`;


exports.getData = function getData(mes, anio) {
    return conn.then(conexion => {
        let resultado;

        return conexion.request()
            .input('mes', sql.Int, mes)
            .input('anio', sql.Int, anio)
            .query( querySueldos )
            .then( result => {
                resultado = result.recordset;
                return resultado;
            })
            .catch(err => {
                return err;
            });

    }).catch((err) => {
        console.log(err);
    });
}