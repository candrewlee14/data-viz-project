#!/user/bin/env python
import pandas as pd
import argparse

def main():
    parser = argparse.ArgumentParser(description='Convert to csv files')

    parser.add_argument('-i','--input', help='Input file', required=True)
    parser.add_argument('-y','--year', help='Year to date to keep', required=True)
    parser.add_argument('-o','--output', help='Output CSV file', required=True)
    args = parser.parse_args()

    if args.input.endswith(".csv"):
        data = pd.read_csv(args.input)
    elif args.input.endswith(".dta"):
        data = pd.io.stata.read_stata(args.input)
    data = data[data.year==int(args.year)]
    cols = ["location_id", "partner_id", "product_id", "year", "export_value", "import_value"]
    data = data[cols]
    data.to_csv(args.output)

if __name__ == "__main__":
    main()