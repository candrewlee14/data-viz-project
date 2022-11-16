#!/user/bin/env python
import pandas as pd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Spit data to separate CVS files by location_id')

    parser.add_argument('-i','--input', help='Input CSV filename (not path)', required=True)
    args = parser.parse_args()

    if args.input.endswith(".csv"):
        data = pd.read_csv(os.path.join("../static/data/", args.input))
    elif args.input.endswith(".dta"):
        data = pd.io.stata.read_stata(args.input)

    location_data = pd.read_csv("../static/data/location.csv")
    location_ids = data.location_id.unique()
    cols = ["location_id", "partner_id", "product_id", "year", "export_value", "import_value"]

    for location_id in location_ids:
        location_code = location_data[location_data.location_id == location_id].iloc[0]["location_code"]
        print(location_code)
        output_data = data[data.location_id == location_id]
        output_data = output_data[cols].reset_index(drop=True)
        if not os.path.exists(os.path.join("../static/data/",location_code)):
            os.mkdir(os.path.join("../static/data/",location_code), 0o755)
        output_data.to_csv(os.path.join("../static/data/",location_code, str(location_code)+"_"+args.input))

if __name__ == "__main__":
    main()