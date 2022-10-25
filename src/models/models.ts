class Location {
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

class Product {
    id: number;
    code: number;
    name: string;
    level: number;
    parent_id: number;

    constructor(d: any) {
        this.id = d['product_id'];
        this.code = d['hs_product_code'];
        this.name = d['hs_product_name_short_en'];
        this.level = d['level'];
        this.parent_id = d['parent_id'];
    }
}

class BilateralTradeYear {
    location_id: number;
    partner_id: number;
    product_id: number;
    year: number;
    export_value: number;
    import_value: number;

    constructor(d: any) {
        this.location_id = d['location_id'];
        this.partner_id = d['partner_id'];
        this.product_id = d['product_id'];
        this.year = d['year'];
        this.export_value = d['export_value'];
        this.import_value = d['import_value'];
    }

}

export {Location, Product, BilateralTradeYear};