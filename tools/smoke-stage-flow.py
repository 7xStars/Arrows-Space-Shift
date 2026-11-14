import subprocess, time, json
from playwright.sync_api import sync_playwright
server=subprocess.Popen(['python3','-m','http.server','4317','--bind','127.0.0.1'],cwd='/mnt/data/Arrow-Space-Shift-v0.23.7-critical-fixes',stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1280,'height':960})
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        resp=page.goto('http://127.0.0.1:4317/?qa=1',wait_until='domcontentloaded',timeout=16000)
        print('HTTP',resp.status,'TITLE',page.title(), 'ERRORS',errors)
        print('READ',page.evaluate('window.arrowSpaceShift?.read()'))
        print('QA control',page.locator('#qa-scenarios button').all_text_contents())
        # initial stage 1 index 0 as qa, enable playback using click
        page.locator('#open-options').click()
        page.locator('button',has_text='QA: Stage 7').click()
        print('STAGE initial',page.evaluate("[window.arrowSpaceShift.read().campaign.index,window.arrowSpaceShift.read().phase]"))
        page.evaluate('window.arrowSpaceShiftTest.finishRouteTrial()')
        page.wait_for_timeout(1000)
        print('STAGE after finish 1s',page.evaluate("[window.arrowSpaceShift.read().campaign.index,window.arrowSpaceShift.read().phase,document.getElementById('overlay-title')?.textContent,document.getElementById('overlay-note')?.textContent]"))
        page.wait_for_timeout(5000)
        print('STAGE after 6s',page.evaluate("[window.arrowSpaceShift.read().campaign.index,window.arrowSpaceShift.read().phase,document.getElementById('overlay-title')?.textContent]"))
        print('ERRORS',errors)
        browser.close()
finally:
    server.terminate();server.wait(timeout=5)
