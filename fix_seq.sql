SELECT setval('company_people_company_person_id_seq', (SELECT MAX(company_person_id) FROM company_people));
