"""Compile fixed educational records while preserving conditional-probability notation.
The ASCII table separator must not be confused with the bar in P(A|B).
"""
from pathlib import Path
p=Path(__file__).with_name('build_impl.py');source=p.read_text()
needle="  row=line.split('|');assert len(row)==12,(stage,len(row),line[:50])"
replacement="  line=re.sub(r'P\\([^)]*\\)',lambda m:m.group(0).replace('|','∣'),line)\n"+needle
assert source.count(needle)==1
source=source.replace(needle,replacement)
exec(compile(source,str(p),'exec'),{'__name__':'__main__','__file__':str(p)})
