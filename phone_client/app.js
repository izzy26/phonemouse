(function () {
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  const uAparser = new UAParser();
  const ua = uAparser.getResult();

  const rotationMultiplier = ua.browser.name === 'Chrome' ? 80 : 2;
  let sendDataInterval = null;
  let rotationData = [];
  
  if ('DeviceMotionEvent' in window) {
    const onDeviceMotion = (eventData) => {
      rotationHandler(eventData.rotationRate);
    }
    window.addEventListener('devicemotion', onDeviceMotion, false);
  } else {
    alert('[Device Error]: No Accelerometer & Gyroscope API available');
  }

  const rotationHandler = (rotation) => {
    const a = rotation.alpha ? rotation.alpha * rotationMultiplier : 0;
    const b = rotation.beta ? rotation.beta * rotationMultiplier : 0;
    const g = rotation.gamma ? rotation.gamma * rotationMultiplier : 0;
    rotationData.push([a, b, g]);
  }

  const app = new Vue({
    el: '#app',
    data: {
      ws: null,
      wsReadyState: 3,
      scrollStart: 0,
    },
    computed: {
      wsStatusText() {
        const statusTextMap = {
          0: 'Connecting...',
          1: 'Connected',
          2: 'Disconnecting...',
          3: 'Disconnected'
        };
        return statusTextMap[this.wsReadyState];
      },
    },
    methods: {
      connectWs() {
        this.ws = new WebSocket(`ws://${location.hostname}:1337`);
        this.wsReadyState = 0;

        this.ws.onopen = () => {
          this.wsReadyState = 1;
          sendDataInterval = setInterval(() => {
            this.sendRotationData();
          }, 50);
        };
        this.ws.onclose = (e) => {
          this.wsReadyState = 3;
          clearInterval(sendDataInterval);
        };
        this.ws.onerror = (error) => {
          console.log('[WebSocket Error]:', error);
          alert('[WebSocket Error]: Can\'t connect to the server. Please try again.');
        };
      },
      disconnectWs() {
        this.wsReadyState = 2;
        this.ws.close();
      },
      sendWsMessage(type, data) {
        if (this.ws && this.ws.readyState === 1) {
          const sendData = {
            type: type,
            data: data,
          };
          this.ws.send(JSON.stringify(sendData));
        }
      },

      sendRotationData() {
        const averageA = rotationData.reduce((p, c) => p + c[0], 0) / rotationData.length;
        const averageB = rotationData.reduce((p, c) => p + c[1], 0) / rotationData.length;
        const averageG = rotationData.reduce((p, c) => p + c[2], 0) / rotationData.length;

        this.sendWsMessage('move', [averageA, averageB, averageG]);

        rotationData = [];
      },

      handleScroll(e, type) {
        switch(type) {
          case 'start':
            this.scrollStart = e.touches[0].pageY;
            break;
          case 'move':
            const scrolled = e.touches[0].pageY;
            const d = scrolled - this.scrollStart;
            if (Math.abs(d) > 30) {
              this.sendWsMessage('scroll', d > 0 ? 'up' : 'down');
            }
            break;
          case 'end':
            this.scrollStart = 0;
            break;
        }
      },
    },
    mounted() {
      this.connectWs();
    },
  });
})();
