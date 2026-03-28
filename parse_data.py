import csv
from datetime import datetime

today_str = datetime.today().strftime('%Y-%m-%d')

with open('datos.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

if 'Priority' not in fieldnames:
    fieldnames.extend(['Priority', 'CreationDate', 'IterationDate', 'ResetDays', 'Collapsed'])

for row in rows:
    row['Priority'] = row.get('Priority', '500')
    row['CreationDate'] = row.get('CreationDate', today_str)
    row['IterationDate'] = row.get('IterationDate', today_str)
    row['ResetDays'] = row.get('ResetDays', '0')
    row['Collapsed'] = row.get('Collapsed', 'False')

with open('datos.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
