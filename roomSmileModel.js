class SuperDeluxeSchema {
    constructor(date, count, price) {
        this.date = date;
        this.count = count;
        this.price = price ;
  }
}

class RoomDateShema {
    constructor(date, roomSchemas){
        this.date = date;
        this.roomSchemas = roomSchemas;
    }
}

module.exports = {
    SuperDeluxeSchema: SuperDeluxeSchema,
    RoomDateShema: RoomDateShema
}