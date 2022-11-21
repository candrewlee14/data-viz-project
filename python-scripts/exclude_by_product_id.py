#!/user/bin/env python
import pandas as pd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Exclude rows of data by product IDs')

    parser.add_argument('-d','--dir', help='Input directory path', required=True)
    args = parser.parse_args()

    cols_to_save = ["location_id", "partner_id", "product_id", "year", "export_value", "import_value"]
    
    # Stones 2
    # Minerals 3 
    # Vehicles 6
    # Machinery 7
    # Electronics 8
    hs_product_ids = set([2, 3, 6, 7, 8])

    product_data = pd.read_csv("../static/data/hs_product.csv")
    hs2_product_ids = set()
    for i, j in product_data.iterrows():
        if i > 0 and int(j["parent_id"]) in hs_product_ids:
            hs2_product_ids.add(int(j["product_id"]))

    print(hs2_product_ids)

    for country_dir in os.listdir(args.dir):
        if not os.path.isfile(os.path.join(args.dir, country_dir)):
            csv_file_path = os.path.join(args.dir, country_dir, country_dir + "_hs2_2010_to_2020.csv")
            print(csv_file_path)
            data = pd.read_csv(csv_file_path)
            data = data[data["product_id"].isin(hs2_product_ids) == False]
            data = data[cols_to_save].reset_index(drop=True)
            os.remove(csv_file_path)
            data.to_csv(csv_file_path)

if __name__ == "__main__":
    main()