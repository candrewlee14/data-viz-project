export default class Location {
    id: number;
    code: string;
    name: string;
    level: number;

    constructor(d: any) {
        this.id = d['location_id'];
        this.code = d['location_code'];
        this.name = d['location_name_short_en'];
        this.level = d['level'];
    }
}