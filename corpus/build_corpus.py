import json, subprocess, re, os
docs = [
 ("NEED-TO-KNOW","Building with SIPs: NEED TO KNOW","SIPA","https://www.sips.org/documents/Building-with-SIPs-NEED-TO-KNOW_bluecover_042221.pdf"),
 ("BP-7-Installation","SIP Builder Best Practices BP-7: SIP Installation","SIPA (hosted by Enercept)","https://enercept.com/wp-content/uploads/2025/04/SIP-BUILDER-BP-7-SIP-Installation-v1-compressed.pdf"),
 ("BP-9-Electrical","SIP Builder Best Practices BP-9: SIP Electrical (v2)","SIPA (hosted by Fischer SIPs)","https://fischersips.com/wp-content/uploads/2025/11/SIP-BUILDER-BP-9-SIP-Electrical-v2.pdf"),
 ("DBP-3-Structural","SIP Design Best Practices BP-3: SIP Structural Capabilities","SIPA (hosted by Extreme Panel)","https://extremepanel.com/wp-content/uploads/2023/04/SIP-DESIGN-BP-3-SIP-Structural-Capabilities-D-BP3-2.pdf"),
 ("DBP-5-Shop-Drawings","SIP Design Best Practices BP-5: SIP Shop Drawings","SIPA (hosted by Extreme Panel)","https://extremepanel.com/wp-content/uploads/2023/04/SIP-DESIGN-BP-5-SIP-Shop-Drawings-D-BP5-1.pdf"),
 ("DBP-7-Installation","SIP Design Best Practices BP-7: SIP Installation","SIPA (hosted by Extreme Panel)","https://extremepanel.com/wp-content/uploads/2023/04/SIP-DESIGN-BP-7-SIP-Installation-D-BP7-1-2.pdf"),
 ("FL-Install-Guidelines","SIPA Structural Insulated Panel Installation Guidelines v2","SIPA (Florida Building Commission copy)","https://floridabuilding.org/upload/PR_Instl_Docs/FL30056_R3_II_SIPA%20Structural%20Insulated%20Panel%20Installation%20Guidelines%20v2.pdf"),
 ("Prescriptive-Method-SIP-Walls","Prescriptive Method for SIP Wall Systems","SIPA","https://www.sips.org/documents/Prescriptive-Method-for-SIP-Wall-Systems.pdf"),
 ("BEST-1","BEST Lesson 1: Introduction to SIPs","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-1-Introduction-to-SIPs.pdf"),
 ("BEST-2","BEST Lesson 2: Basic SIP Design and Engineering","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-2-Basic-SIP-Design-and-Engineering.pdf"),
 ("BEST-3","BEST Lesson 3: The SIP Order Process","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-3-The-SIP-Order-Process.pdf"),
 ("BEST-4","BEST Lesson 4: SIP Building Science","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-4-SIP-Building-Science.pdf"),
 ("BEST-5","BEST Lesson 5: SIP Layout Drawings","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-5-SIP-Layout-Drawings.pdf"),
 ("BEST-7","BEST Lesson 7: SIP Layout and Panel Installation","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-7-SIP-Layout-and-Panel-Installation.pdf"),
 ("BEST-9","BEST Lesson 9: SIP Finish Material and Detailing","SIPA BEST","https://www.sips.org/documents/SIPA-BEST-9-SIP-Finish-Material-and-Detailing.pdf"),
]
out=[]; total=0
for key,title,src,url in docs:
    n=int(re.search(r"Pages:\s+(\d+)",subprocess.run(["pdfinfo",f"pdf/{key}.pdf"],capture_output=True,text=True).stdout).group(1))
    pages=[]
    for p in range(1,n+1):
        t=subprocess.run(["pdftotext","-f",str(p),"-l",str(p),f"pdf/{key}.pdf","-"],capture_output=True,text=True).stdout
        t=re.sub(r"[ \t]+"," ",t); t=re.sub(r"\n{3,}","\n\n",t).strip()
        if len(t)>40: pages.append({"page":p,"text":t}); total+=len(t)
    out.append({"id":key,"title":title,"source":src,"url":url,"pages":pages})
    print(f"{key:32s} {len(pages):3d}/{n:3d} pages with text")
json.dump(out,open("corpus.json","w"),indent=1)
print("total chars",total, "~tokens", total//4)
