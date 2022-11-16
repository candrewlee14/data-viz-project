#!/user/bin/env python
import pandas as pd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Combine data from different years into one csv file')

    parser.add_argument('-d','--dir', help='Input directory path', required=True)
    args = parser.parse_args()
    cols = ["location_id", "partner_id", "product_id", "year", "export_value", "import_value"]


    # walk through each one of its directory
    for filename1 in os.listdir(args.dir):
        if not os.path.isfile(os.path.join(args.dir, filename1)):
            print(filename1)
            country_dir = os.path.join(args.dir, filename1)
            country_data = pd.DataFrame()
            prefixed = [filename2 for filename2 in os.listdir(country_dir) if filename2.startswith(filename1 + "_hs2_") and not filename2.endswith("2010_to_2020.csv")]
            for file_by_year in prefixed:
                data = pd.read_csv(os.path.join(country_dir, file_by_year))
                country_data = pd.concat([country_data, data], ignore_index=True)
                os.remove(os.path.join(country_dir, file_by_year))
            country_data = country_data[cols].reset_index(drop=True)
            country_data.to_csv(os.path.join(country_dir, filename1 + "_hs2_2010_to_2020.csv"))

if __name__ == "__main__":
    main()