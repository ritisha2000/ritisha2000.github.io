import pandas as pd
import argparse
import sys
import re
import json

def parse_args(args):
    parser = argparse.ArgumentParser(
        description="Converts the data from Workday into JSON file(s) to be used in the coursemap."
    )
    parser.add_argument(
        "--course_data",
        type=str,
        help="Enter the relative path to the CSV with course data",
        default="data/course_data.csv",
    )
    parser.add_argument(
        "--course_themes",
        type=str,
        help="Enter the relative path to the CSV with data for course themes",
        default="data/course_themes.csv",
    )
    args = parser.parse_args(args)
    return args

# Function to create list of column names where values are True
def get_themes(row):
    themes = []
    if row['Sustainability']:
        themes.append('Sustainability')
    if row['Climate']:
        themes.append('Climate')
    if row['3-6-9']:
        themes.append('3-6-9')
    return themes

# Function to split text into sentences and categorize them
def categorize_reqs(text):
    if not isinstance(text, str):
        return '', '', ''
    
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    
    prereqs = []
    coreqs = []
    flagged = []
    
    for sentence in sentences:
        if sentence.startswith('Prerequisite:'):
            prereqs.append(sentence)
        elif sentence.startswith('Corequisite:'):
            coreqs.append(sentence)
        else:
            flagged.append(sentence)
    
    return ' '.join(prereqs), ' '.join(coreqs), ' '.join(flagged)

def merge_files(df1, df2):
    '''
    Merges the themes dataftame with course data
    '''
    df1 = df1.drop_duplicates(subset='Course')
    df2 = df2.rename(columns={'Course Code': 'Course'})
    df2_required_cols = df2.iloc[:, :5] # Select the required columns
    courses = df1.merge(df2_required_cols, on='Course', how='left')

    columns_to_convert = ['Sustainability', 'Climate', '3-6-9']
    courses[columns_to_convert] = courses[columns_to_convert].fillna(False).astype('bool')

    # Apply the get_themes function to each row and create a new 'themes' column
    courses['themes'] = courses.apply(get_themes, axis=1)
    courses.drop(columns=['Sustainability', 'Climate', '3-6-9'], inplace=True)

    return courses

def exrtact_requisites(course_full_list):

    # Select relevant columns from course_list
    course_full_list = course_full_list[['Course Subject', 'Course', 'Section Title', 'Description', 'themes']]
    course_full_list = course_full_list.rename(columns={'Course Subject': 'course_code',
                                                        'Course': 'course',
                                                        'Section Title': 'course_title',
                                                        'Description': 'description'})

    # Extract 'Prerequisite' or 'Corequisite' information and create a new 'reqs' column safely
    course_full_list = course_full_list.assign(
        reqs=course_full_list['description'].str.extract(
            r'((prerequisite|corequisite)[\s\S]*)', 
            flags=re.IGNORECASE
        )[0]    
    )

    # Pattern to remove sentence
    pattern = r'\b[A-Z]{4}\s\d{3}\sis\srecommended\.'
    # Remove the sentence if present
    course_full_list.loc[:, 'reqs'] = course_full_list['reqs'].str.replace(pattern, '', regex=True)

    # Apply the categorize_reqs function to each row
    course_full_list[['prereqs', 'coreqs', 'flag']] = course_full_list['reqs'].apply(lambda x: pd.Series(categorize_reqs(x)))

    # Extracting courses and putting them in lists after formatting
    course_full_list.loc[:, 'prereq_courses'] = course_full_list['prereqs'].apply(
    lambda x: re.findall(r'[A-Z]{4}\s*\d{3}', str(x)) if isinstance(x, str) else []
    )
    course_full_list.loc[:, 'coreq_courses'] = course_full_list['coreqs'].apply(
        lambda x: re.findall(r'[A-Z]{4}\s*\d{3}', str(x)) if isinstance(x, str) else []
    )

    course_full_list.loc[:, 'prereq_courses'] = course_full_list['prereq_courses'].apply(
    lambda lst: [code.replace(' ', '_V ', 1) for code in lst])
    course_full_list.loc[:, 'coreq_courses'] = course_full_list['coreq_courses'].apply(
        lambda lst: [code.replace(' ', '_V ', 1) for code in lst])
    
    course_full_list = course_full_list.copy()
    course_full_list = course_full_list.drop(columns=['reqs', 'prereqs', 'coreqs'])

    return course_full_list

def to_json(course_map_df):
    nodes = []
    valid_ids_by_code = {}

    for _, row in course_map_df.iterrows():
        course_id = row['course']
        code = row['course_code']
        if code not in valid_ids_by_code:
            valid_ids_by_code[code] = set()
        valid_ids_by_code[code].add(course_id)
        nodes.append({
            'course_id': course_id,
            'course_name': row['course_title'],
            'x': 0,  # Set x and y to some default or calculate positions
            'y': 0,
            'course_code': row['course_code'],
            'description': row['description'],
            'themes': row['themes']
        })

    # Prepare links, filtering out different course code sources and targets
    links = []
    for _, row in course_map_df.iterrows():
        source_course = row['course']
        code = row['course_code']
        if source_course in valid_ids_by_code.get(code, set()):
            for prereq in row['prereq_courses']:
                if prereq in valid_ids_by_code.get(code, set()):
                    links.append({
                        'source': source_course,
                        'target': prereq
                    })
            for coreq in row['coreq_courses']:
                if coreq in valid_ids_by_code.get(code, set()):
                    links.append({
                        'source': source_course,
                        'target': coreq
                    })

    # Create JSON structure
    course_data = {
        'nodes': nodes,
        'links': links
    }

    return course_data

def main():
    inputs = parse_args(sys.argv[1:])

    # Read course data and course theme files
    course_data = pd.read_csv(inputs.course_data)
    course_themes = pd.read_csv(inputs.course_themes)

    course_full_list = merge_files(course_data, course_themes)
    course_map_df = exrtact_requisites(course_full_list)
    course_map_json = to_json(course_map_df)

    # Path to the output JSON file
    output_file = 'data/data.json'

    # Write data to the JSON file
    with open(output_file, 'w') as file:
        json.dump(course_map_json, file, indent=4)

if __name__ == '__main__':
    main()