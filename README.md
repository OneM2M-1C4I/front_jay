# Server Setting

## Install TinyIoT Pletform
https://github.com/seslabSJU/tinyIoT

### 1.CORS Setting
cross origin 문제를 해결하기위해서 source/server/config.h 아래 주석 제거
```
#define CORS
```

## 2. Run IoT Server
- pm2가 설치되어있을경우  
  - pm2 start tinyIoT/source/server
- pm2가 설치되어있지않을 경우
  - tinyIoT/source/server

## 3. RUN Project
git clone https://github.com/OneM2M-1C4I/front_mid
npm install
node app.js

## 4. Start Service
- dashboard/kiosk
  - http://localhost:8369/seat
- user seat
  - seat_test.html
  - 해당 파일은 서버 url을 통해 실행하지않고 html파일 자체를 실행하는것을 권장함.
    - WebRTC 정책으로 인한 오류가 날수 있음.
