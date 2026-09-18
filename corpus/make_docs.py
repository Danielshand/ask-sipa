import json,os
here=os.path.dirname(os.path.abspath(__file__))
c=json.load(open(os.path.join(here,'corpus.json')))
meta={d['id']:{"title":d['title'],"url":d['url'],"pages":len(d['pages'])} for d in c}
open(os.path.join(here,'..','public','docs.js'),'w').write("window.ASK_SIPA_DOCS="+json.dumps(meta,indent=1)+";\n")
print(len(meta),"docs written to public/docs.js")
