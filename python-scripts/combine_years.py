#!/user/bin/env python
import pandas as pd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Combine data from different years into one csv file')

    parser.add_argument('-d','--dir', help='Input directory path', required=True)
    args = parser.parse_args()
    cols = ["location_id", "partner_id", "product_id", "year", "export_value", "import_value"]

    for filename1 in os.listdir(args.dir):
        if not os.path.isfile(os.path.join(args.dir, filename1)):
            
            country_dir = os.path.join(args.dir, filename1)
            print(country_dir)
    # country_dir = os.path.join("../static/data/", args.dir)
            country_data = pd.DataFrame()
            prefixed = [filename2 for filename2 in os.listdir(country_dir) if filename2.startswith(filename1 + "_hs2_") or filename2.startswith(filename1 + "_hs4_")]
            # prefixed = [filename2 for filename2 in os.listdir(country_dir) if filename2.startswith(args.dir + "_hs2_") or filename2.startswith(args.dir + "_hs4_")]
            for file_path in prefixed:
                data = pd.read_csv(os.path.join(country_dir, file_path))
                country_data = pd.concat([country_data, data], ignore_index=True)
                os.remove(os.path.join(country_dir, file_path))
            country_data = country_data[cols].reset_index(drop=True)
            country_data.to_csv(os.path.join(country_dir, filename1 + "_hs2_2010_to_2020.csv"))
    # country_data.to_csv(os.path.join(country_dir, args.dir + "_hs2_2010_to_2020.csv"))

if __name__ == "__main__":
    main()