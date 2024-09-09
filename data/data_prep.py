import pandas as pd
import argparse
import sys

def parse_args(args):
    parser = argparse.ArgumentParser(
        description="Converts the data from Workday into JSON file(s) to be used in the coursemap."
    )
    parser.add_argument(
        "--course_data",
        type=str,
        help="Enter the relative path to the CSV with course data",
        default="course_data.csv",
    )
    args = parser.parse_args(args)
    return args

def main():
    inputs = parse_args(sys.argv[1:])
    
    course_data = pd.read_csv(inputs.course_data)

if __name__ == '__main__':
    main()