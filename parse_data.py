import csv

with open('datos.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

if 'Forecast' not in fieldnames:
    fieldnames.append('Forecast')

for row in rows:
    row['Forecast'] = row.get('Forecast', '0.5')

with open('datos.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
