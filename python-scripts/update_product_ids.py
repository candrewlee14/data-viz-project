#!/user/bin/env python
import pandas as pd
import argparse
import os

def main():
    cols_to_save = ["product_id","hs_product_code","hs_product_name_short_en","level","parent_id"]
    file_dir = "../static/data/hs_product_copy.csv"
    product_data = pd.read_csv(file_dir)
    
    # Stones 2
    # Minerals 3 
    # Vehicles 6
    # Machinery 7
    # Electronics 8
    hs_product_ids = set([2, 3, 6, 7, 8])

    hs2_product_ids = set()
    for i, j in product_data.iterrows():
        if i > 0 and int(j["parent_id"]) in hs_product_ids:
            hs2_product_ids.add(int(j["product_id"]))

    hs4_product_ids = set()
    for i, j in product_data.iterrows():
        if i > 0 and int(j["parent_id"]) in hs2_product_ids:
            hs4_product_ids.add(int(j["product_id"]))
            product_data.at[i, "parent_id"] = product_data[product_data["product_id"] == int(j["parent_id"])].iloc[0]["parent_id"] ## find parent_id's parent_id

    print(hs4_product_ids)
    product_data = product_data[cols_to_save].reset_index(drop=True)
    product_data.to_csv("../static/data/hs_product_new.csv")

if __name__ == "__main__":
    main()