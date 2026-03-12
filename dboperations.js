var config = require('./dbconfig');
const sql = require('mssql');

async function getArrivalGuests(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
        "select  a.LastName Name, a.MailM as Email from folio a join ActiveFolio b on a.FolioNum = b.FolioNum where convert(date, a.ArrivalDate) = CAST(GETDATE() AS DATE)"
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getDepartureGuests(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
        "select LTRIM(FirstName + ' ' + LastName) as Name,MailM as Email from folio  where convert(date, DepartureDate) = CAST(GETDATE() AS DATE) and checkInTime is not NULL and CreditCardHolder <> 'Booking.com' and CreditCardHolder <> 'Agoda'"
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getDepartureGuestsFromBooking(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
        "select  LTRIM(FirstName + ' ' + LastName) as Name,MailM as Email from folio  where convert(date, DepartureDate) = CAST(GETDATE() AS DATE) and checkInTime is not NULL and CreditCardHolder = 'Booking.com'"
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}


async function getDepartureGuestsFromAgoda(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
        "select  LTRIM(FirstName + ' ' + LastName) as Name,MailM as Email from folio  where convert(date, DepartureDate) = CAST(GETDATE() AS DATE) and checkInTime is not NULL and CreditCardHolder = 'Agoda'"
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getDepartureGuestsFromAgoda(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
        "select  LTRIM(FirstName + ' ' + LastName) as Name,MailM as Email from folio  where convert(date, DepartureDate) = CAST(GETDATE() AS DATE) and checkInTime is not NULL and CreditCardHolder = 'Agoda'"
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getMinMaxRoomPrice(fromDate, toDate){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request()
        .input('fromDate', sql.DateTime2, fromDate)
        .input('toDate', sql.DateTime2, toDate)
        .query(
        `WITH cte
            AS (SELECT CONVERT(DATETIME, @fromDate) AS myDate
                UNION ALL
                SELECT Dateadd(day, 1, mydate) AS myDate
                FROM   cte
                WHERE  Dateadd(day, 1, mydate) <= CONVERT(DATETIME, @toDate))
        SELECT Concat(Datepart(dd, mydate), '-', Datepart(mm, mydate), '-',
                    Datepart(yyyy, mydate)) AS 'date',
            occ.roomtypecode,
			 CASE 
				WHEN occ.roomtypecode = 'DLXDB' THEN 8 - count(*)
				WHEN occ.roomtypecode = 'DLXTW' THEN 4 - count(*)
				WHEN occ.roomtypecode = 'FAMDC' THEN 2 - count(*)
				WHEN occ.roomtypecode = 'FAMDTW' THEN 2 - count(*)
				WHEN occ.roomtypecode = 'FAMS' THEN 2 - count(*)
				WHEN occ.roomtypecode = 'FAMSTW' THEN 2 - count(*)
				WHEN occ.roomtypecode = 'LUXRY' THEN 2 - count(*)
				WHEN occ.roomtypecode = 'SDXDB' THEN 13 - count(*)
				WHEN occ.roomtypecode = 'SDXTW' THEN 3 - count(*)
				WHEN occ.roomtypecode = 'SUITE' THEN 3 - count(*)
				WHEN occ.roomtypecode = 'SUPDB' THEN 4 - count(*)
				WHEN occ.roomtypecode = 'SUPTW' THEN 3 - count(*)
			END AS 'count',
            max(f.rateamount)            AS 'maxprice',
            min(f.rateamount)            AS 'minprice'
        FROM   cte
            JOIN (SELECT *
                    FROM   activefolio af) AS occ
                ON occ.arrivaldate <= mydate
                    AND occ.departuredate > mydate
            JOIN folio f
                ON f.folionum = occ.folionum
        GROUP  BY mydate,
                occ.roomtypecode
        ORDER  BY mydate,
                occ.roomtypecode
        OPTION (maxrecursion 0)`
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getSuperDeluxePeakRoomDate(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
                `WITH Numbers AS (
                SELECT 0 AS n
                UNION ALL
                SELECT n + 1
                FROM Numbers
                WHERE n < 100
            ),
            cte AS (
                -- Range 1
                SELECT DATEADD(day, n, '2026-07-01') AS mydate
                FROM Numbers
                WHERE DATEADD(day, n, '2026-07-01') <= '2026-08-31'

                UNION ALL

                -- Range 2
                SELECT DATEADD(day, n, '2026-04-01')
                FROM Numbers
                WHERE DATEADD(day, n, '2026-04-01') <= '2026-04-30'

                UNION ALL

                -- Range 3
                SELECT DATEADD(day, n, '2026-11-01')
                FROM Numbers
                WHERE DATEADD(day, n, '2026-11-01') <= '2026-11-30'
            )
            SELECT Concat(Datepart(dd, mydate), '-', Datepart(mm, mydate)) AS 'Date',
                occ.roomtypecode,
                Count(*)                     AS 'Count',
                max(f.rateamount)            AS 'Max Price'
            FROM   cte
                JOIN (SELECT *
                        FROM   activefolio af) AS occ
                    ON occ.arrivaldate <= mydate
                        AND occ.departuredate > mydate
                JOIN folio f
                    ON f.folionum = occ.folionum
            where occ.RoomTypeCode = 'SDXDB' 
            GROUP  BY mydate,
                    occ.roomtypecode
            HAVING count(*) > 5
            and max(f.rateamount) < 2600000
            ORDER  BY mydate,
                    occ.roomtypecode
            OPTION (maxrecursion 0)`
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getOccPeakRoomDate(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
                `WITH Numbers AS (
                    SELECT 0 AS n
                    UNION ALL
                    SELECT n + 1
                    FROM Numbers
                    WHERE n < 100
                ),
                cte AS (
                    -- Range 1
                    --SELECT DATEADD(day, n, '2026-07-01') AS mydate
                    --FROM Numbers
                    --WHERE DATEADD(day, n, '2026-07-01') <= '2026-08-31'

                    --UNION ALL

                    -- Range 2
                    SELECT DATEADD(day, n, '2026-04-01') as mydate
                    FROM Numbers
                    WHERE DATEADD(day, n, '2026-04-01') <= '2026-04-30'
                )
                SELECT Concat(Datepart(dd, mydate), '-', Datepart(mm, mydate), '-',
                            Datepart(yyyy, mydate)) AS 'Date',
                    ROUND(COUNT(*) * 100.0 / 48, 2)                     AS 'Occ'
                FROM   cte
                    JOIN (SELECT *
                            FROM   activefolio af) AS occ
                        ON occ.arrivaldate <= mydate
                            AND occ.departuredate > mydate
                    JOIN folio f
                        ON f.folionum = occ.folionum
                GROUP  BY mydate
                --HAVING count(*) > 24
                ORDER  BY mydate
                OPTION (maxrecursion 0)`
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getOccLowRoomDate(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
                `WITH Numbers AS (
                    SELECT 0 AS n
                    UNION ALL
                    SELECT n + 1
                    FROM Numbers
                    WHERE n < 100
                ),
                cte AS (
                    -- Range 1
                    --SELECT DATEADD(day, n, '2026-07-01') AS mydate
                    --FROM Numbers
                    --WHERE DATEADD(day, n, '2026-07-01') <= '2026-08-31'

                    --UNION ALL

                    -- Range 2
                    SELECT DATEADD(day, n, '2026-05-01') as mydate
                    FROM Numbers
                    WHERE DATEADD(day, n, '2026-05-01') <= '2026-05-31'
                )
                SELECT Concat(Datepart(dd, mydate), '-', Datepart(mm, mydate), '-',
                            Datepart(yyyy, mydate)) AS 'Date',
                    ROUND(COUNT(*) * 100.0 / 48, 2)                     AS 'Occ'
                FROM   cte
                    JOIN (SELECT *
                            FROM   activefolio af) AS occ
                        ON occ.arrivaldate <= mydate
                            AND occ.departuredate > mydate
                    JOIN folio f
                        ON f.folionum = occ.folionum
                GROUP  BY mydate
                --HAVING count(*) > 24
                ORDER  BY mydate
                OPTION (maxrecursion 0)`
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

async function getSuperDeluxeSaleRoomDate(){
    try{
        let pool = await sql.connect(config);
        let results = await pool.request().query(
                `WITH Numbers AS (
                SELECT 0 AS n
                UNION ALL
                SELECT n + 1
                FROM Numbers
                WHERE n < 100
            ),
            cte AS (
                -- Range 1
                SELECT DATEADD(day, n, '2026-04-01') AS mydate
                FROM Numbers
                WHERE DATEADD(day, n, '2026-04-01') <= '2026-04-30'
            )
            SELECT Concat(Datepart(dd, mydate), '-', Datepart(mm, mydate)) AS 'Date',
                Count(*)                     AS 'Count',
                max(f.rateamount)            AS 'Max Price'
            FROM   cte
                JOIN (SELECT *
                        FROM   activefolio af) AS occ
                    ON occ.arrivaldate <= mydate
                        AND occ.departuredate > mydate
                JOIN folio f
                    ON f.folionum = occ.folionum
            where occ.RoomTypeCode = 'SDXDB' 
            GROUP  BY mydate
            ORDER  BY mydate
            OPTION (maxrecursion 0)`
        );
        return results.recordsets;
    }
    catch (error){
        console.log(error);
    }
}

module.exports ={
    getArrivalGuests : getArrivalGuests,
    getDepartureGuests: getDepartureGuests,
    getDepartureGuestsFromBooking: getDepartureGuestsFromBooking,
    getDepartureGuestsFromAgoda: getDepartureGuestsFromAgoda,
    getMinMaxRoomPrice: getMinMaxRoomPrice,
    getSuperDeluxePeakRoomDate: getSuperDeluxePeakRoomDate,
    getOccPeakRoomDate: getOccPeakRoomDate,
    getOccLowRoomDate: getOccLowRoomDate,
    getSuperDeluxeSaleRoomDate: getSuperDeluxeSaleRoomDate
}