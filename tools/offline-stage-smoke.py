"""Browser-only acceptance: no network requests or external server required.
This harness bundles the existing app into an in-memory CommonJS module table
and uses the same normal HTML, CSS, DOM, renderer, and stage advancement code.
Requires Python playwright and Chromium for development testing.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import re, subprocess, json
root=Path(__file__).resolve().parent.parent
subprocess.run(['node',str(root/'tools/bundle-offline.cjs'),'--qa'],cwd=root,check=True,stdout=subprocess.DEVNULL)
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*src="src/app.js"[^>]*></script>','',html)
html=re.sub(r'<link[^>]*href="style.css"[^>]*>', '', html)
html=html.replace('</head>','<style>'+ (root/'style.css').read_text()+'</style></head>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':940})
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(html)
 page.add_script_tag(content=(root/'offline-bundle.js').read_text())
 assert page.evaluate('typeof window.arrowSpaceShiftTest')=='object'
 records=[]
 for start_index in (0,1,9,18):
  state=page.evaluate('(i)=>window.arrowSpaceShiftTest.loadChapterTrial(i)',start_index)
  assert state['phase']=='running', (start_index,state['phase'])
  page.evaluate('window.arrowSpaceShiftTest.finishRouteTrial()')
  end=page.evaluate('window.arrowSpaceShiftTest.advance(0.4)')
  # Level 0 is a tutorial; use only route indexes above for clear tests.
  if start_index==0:
   records.append({'index':start_index,'phase':end['phase'],'note':'tutorial requires the scripted control actions'})
   continue
  assert end['phase']=='cleared',(start_index,end['phase'])
  # The actual game drives its intermission via requestAnimationFrame.
  page.wait_for_timeout(3500)
  after=page.evaluate('window.arrowSpaceShift.read()')
  if errors: raise AssertionError('UI runtime exception: '+str(errors))
  assert after['campaign']['index']==start_index+1, (start_index,after['campaign']['index'],after['phase'])
  assert after['phase']=='running',(start_index,after['phase'])
  records.append({'index':start_index,'next':after['campaign']['index'],'phase':after['phase'],'success':True})
 # Show that actual UI calls finish and switching stages do not throw in browser.
 assert not errors,errors
 print(json.dumps({'result':'PASS','transitions':records,'page_errors':errors},indent=2))
 browser.close()
