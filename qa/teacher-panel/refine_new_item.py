from pathlib import Path
p=Path('qa/teacher-panel/expansion-primary.txt');s=p.read_text()
a='¿Qué oración está escrita correctamente?~marta lee.~Marta lee.~Marta lee siempre sin signo final~B'
b='¿Qué convención se aplica al inicio y al final de una oración declarativa sencilla?~Empezar en minúscula y no cerrar~Empezar con mayúscula y cerrar con punto~Escribir todas las letras en mayúscula siempre~B'
assert s.count(a)==1
p.write_text(s.replace(a,b))
print('Clarified the new question, preserving existing case-safe fallback and all runtime algorithms.')
