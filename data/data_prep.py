import pandas as pd
from json import loads
import json
import numpy as np
import networkx as nx
import re
import argparse
import sys
import os

def parse_args(args):
    parser = argparse.ArgumentParser(
        description="Converts the data from Workday into JSON file(s) to be used in the coursemap."
    )
    parser.add_argument(
        "--course_data_path",
        type=str,
        help="Enter the path to the directory with course data files in Excel format.",
        default="data/course_files",
    )
    parser.add_argument(
        "--output_path",
        type=str,
        help="Enter the output path with JSON filename.",
        default="data/course_data.json",
    )
    args = parser.parse_args(args)
    return args

def format_reqs(df, colname):
    temp = df[["course_id", colname]].copy()
    temp[colname] = temp[colname].str.split('; ')
    temp = temp.explode(colname).dropna().rename(columns={
        "course_id": "target",
        colname: "source"
    }).replace('', np.nan).dropna().copy()
    temp["link_type"] = colname.split('_')[0]

    return temp

def convert_to_json(df):
    df = df.reset_index().drop(columns="index")
    result = df.to_json(orient="index")
    nodes = loads(result)

    course_json = {}
    course_json["nodes"] = list(map(dict, nodes.values()))

    prereqs = format_reqs(df, "prereq_courses")
    coreqs = format_reqs(df, "coreq_courses")

    result = pd.concat([prereqs, coreqs], ignore_index=True).to_json(orient="index")
    links = loads(result)

    course_json["links"] = list(map(dict, links.values()))

    return course_json

# Add jitter to reduce overlap
def add_jitter(pos, jitter_strength=0.1):
    pos_jittered = pos.copy()
    for node in pos_jittered:
        pos_jittered[node] = (pos[node][0] + np.random.uniform(-jitter_strength, jitter_strength),
                                 pos[node][1] + np.random.uniform(-jitter_strength, jitter_strength))
    return pos_jittered

def scale_coordinates(df, min_val=10, max_x_val=700, max_y_val=400):
    x_min, x_max = df['x'].min(), df['x'].max()
    y_min, y_max = df['y'].min(), df['y'].max()
    
    df['x'] = min_val + (df['x'] - x_min) / (x_max - x_min) * (max_x_val - min_val)
    df['y'] = min_val + (df['y'] - y_min) / (y_max - y_min) * (max_y_val - min_val)

    return df

def add_node_coordinates(df):
    course_json = convert_to_json(df)

    nodes = course_json["nodes"]
    edges = course_json["links"]

    G = nx.DiGraph()
    for node in nodes:
        G.add_node(node["course_id"], course_name=node["course_id"])
    for edge in edges:
        G.add_edge(edge["source"], edge["target"])

    ## ! EDIT LAYOUT ! ##
    pos = nx.kamada_kawai_layout(G)

    pos_jittered = add_jitter(pos, jitter_strength=0.5)

    node_positions = pd.DataFrame(pos_jittered).T.reset_index()
    node_positions.columns = ['course_id', 'x', 'y']

    df = df.merge(node_positions, on="course_id", how="left")
    df = scale_coordinates(df)

    return df

def extract_reqs(text, keyword):
    if isinstance(text, str):
        match = re.search(fr'{keyword}:.*?[.\]]', text)
        return match.group(0) if match else ''
    return ''

def split_course_code(course_code):
    try:
        return [re.search(r'[A-Z]{4}', course_code).group(0), re.search(r'\d{3}', course_code).group(0)]
    except:
        return None

def find_requisites(df):
    # Separate requisites and description
    course_description = df[["course_id", "description"]].copy()
    course_description.loc[:, "reqs"] = course_description["description"].str.extract(
        r'((prerequisite|corequisite)[\s\S]*)', 
        flags=re.IGNORECASE
    )[0]
    # Remove recommended
    pattern = r'\b[A-Z]{4}\s\d{3}\sis\srecommended\.'
    course_description['reqs'] = course_description['reqs'].str.replace(pattern, '', regex=True)

    # Create 'prereqs' and 'coreqs' columns
    course_description['prereqs'] = course_description['reqs'].apply(lambda x: extract_reqs(x, 'Prerequisite'))
    course_description['coreqs'] = course_description['reqs'].apply(lambda x: extract_reqs(x, 'Corequisite'))
    
    course_description['prereq_courses'] = course_description['prereqs'].apply(
        lambda x: re.findall(r'[A-Z]{4}\s*\d{3}', str(x)) if isinstance(x, str) else []
    )
    course_description['coreq_courses'] = course_description['coreqs'].apply(
        lambda x: re.findall(r'[A-Z]{4}\s*\d{3}', str(x)) if isinstance(x, str) else []
    )

    course_description.drop(columns=['prereqs', 'coreqs', "description"], inplace=True)
    course_description["prereq_courses"] = course_description["prereq_courses"].apply("; ".join)
    course_description["coreq_courses"] = course_description["coreq_courses"].apply("; ".join)

    df = df.merge(course_description, on="course_id", how="left")

    # Add prereqs and coreqs not included in the course data
    missed_courses = list(set(
        list(df["prereq_courses"].str.split("; ").explode().dropna()) + list(df["coreq_courses"].str.split("; ").explode().dropna())
    ) - set(df["course_id"]))

    df = pd.concat([df, pd.DataFrame({
        "course_id": missed_courses, 
        "course_subject": [split_course_code(x)[0] if split_course_code(x) != None else np.nan for x in missed_courses]
    })])

    return df

def clean_course_data(df):
    # Format the column names
    df.columns = [x.strip().lower().replace(" ", "_") for x in df.columns.tolist()]

    # Create id column
    df["course_id"] = df["course_subject"] + " " + df["course_number"].astype(str)
    df["course_id"] = df["course_id"].str.replace("_V", "")

    # Only keep undergraduate courses
    df = df[df["academic_level"] == "Undergraduate"]

    # Remove course duplicates
    df = df.drop_duplicates(subset="course_id")

    df["course_subject"] = df["course_subject"].str.replace("_V", "")
    df["grayedOut"] = False
    df["description"] = df["description"].fillna("")

    return df

def main():
    inputs = parse_args(sys.argv[1:])

    # Check for correct file format
    if (type(inputs.course_data_path) != str):
        raise TypeError("The path to the course data must be in string format.")
    
    print(f"Reading in Data...")
    course_data = [pd.DataFrame(pd.read_excel(os.path.join(inputs.course_data_path, f), skiprows=1)) for f in os.listdir(inputs.course_data_path)]
    course_data = pd.concat(course_data)
    
    print(f"Cleaning course data...")
    course_data = clean_course_data(course_data)

    print(f"Extracting requisities...")
    course_data = find_requisites(course_data)

    # Keep only relevant columns
    course_data = course_data[[
        "course_id", "course_subject", "course_number", "section_title", "eligbility_rules", 
        "term", "delivery_mode", "description", "prereq_courses", "coreq_courses"
    ]].copy()

    print(f"Adding coordinates...")
    course_data = add_node_coordinates(course_data)

    
    course_data["course_id"] = course_data["course_id"].str.strip().replace("", np.nan)
    course_data.dropna(subset="course_id", inplace=True)

    print(f"Converting to JSON...")
    course_json = convert_to_json(course_data)

    # Save data
    with open(inputs.output_path, 'w') as f:
        json.dump(course_json, f)

if __name__ == '__main__':
    main()