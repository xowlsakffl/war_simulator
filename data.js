window.PANDO_DATA = {
  countries: {
    goguryeo: {
      name: '고구려',
      capital: '평양',
      color: '#a74735',
      summary:
        '장수왕이 다스린다. 고구려는 475년 가을 백제의 도읍 한성을 함락했다.',
      economy:
        '평양 일대의 농경지를 바탕으로 여러 지역에서 곡물과 공물을 거두었다.',
      army: '장수왕의 한성 원정에서 병력을 동원한 기록이 남아 있다.',
      equipment: '고분벽화에서 말갖춤과 갑옷을 갖춘 기병의 모습을 볼 수 있다.',
      goal: '넓어진 영역에서 여러 고을의 신뢰를 얻는다.',
      resources: { grain: 72, trust: 50, trade: 54 },
    },
    baekje: {
      name: '백제',
      capital: '웅진',
      color: '#344e76',
      summary:
        '한성이 함락된 뒤 문주왕은 웅진에 새 도읍을 정했다. 새 조정이 첫겨울을 맞는다.',
      economy:
        '한성 시기의 유적에는 농기구와 생활용 철기를 만들고 쓴 흔적이 남아 있다.',
      army: '한성의 여러 토성과 그곳에서 나온 무기가 당시 군사의 모습을 전한다.',
      equipment: '풍납토성에서 철제 화살촉과 창이 출토됐다.',
      goal: '곡물과 물자가 다시 돌도록 새 도읍을 재건한다.',
      resources: { grain: 48, trust: 54, trade: 55 },
    },
    silla: {
      name: '신라',
      capital: '금성',
      color: '#ab7c30',
      summary:
        '자비 마립간이 다스린다. 신라는 고구려의 남하에 대응하며 백제와 협력하고 있다.',
      economy: '경주 일대에서 농업과 철기 생산이 발달했다.',
      army: '475년 한성이 위기에 놓였을 때 신라가 백제를 돕기 위해 군사를 보낸 기록이 있다.',
      equipment:
        '신라 무덤에서 나온 철제 판갑옷과 말갖춤이 당시의 무장을 보여준다.',
      goal: '고을의 살림을 지키면서 이웃과의 교역을 넓힌다.',
      resources: { grain: 60, trust: 64, trade: 58 },
    },
  },
  events: {
    goguryeo: [
      {
        title: '두 장의 곡물 장부',
        place: '한성',
        body: '같은 집 곡식이 두 장부에 올라 있다. 한 집에서 두 번 걷을 수는 없다. 새 장부는 누구 손에 맡길까?',
        choices: [
          {
            intent: 'council',
            label: '마을 어른과 장부를 맞춘다',
            desc: '징수를 미루고 주민에게 확인한다.',
            delta: { grain: -5, trust: 10, trade: 0 },
            influence: 2,
            result:
              '집집마다 두 장부를 대조했다. 이름이 한 번씩만 남자 고을 사람들이 창고 문을 열었다.',
          },
          {
            intent: 'reserve',
            label: '먼저 확인된 몫만 거둔다',
            desc: '비축량을 확보한다.',
            delta: { grain: 8, trust: -4, trade: 0 },
            influence: 0,
            result:
              '창고는 채워졌다. 먼저 낸 집과 나중에 낼 집 사이에는 아직 말이 많다.',
          },
          {
            intent: 'relief',
            label: '겹친 집의 몫을 면제한다',
            desc: '곡식을 덜 걷고 민심을 얻는다.',
            delta: { grain: -9, trust: 12, trade: 0 },
            influence: 1,
            result:
              '두 번 걷힐까 잠을 못 잤다는 노인이 관아 앞에 햇밤 한 줌을 놓고 갔다.',
          },
        ],
      },
      {
        title: '강 건너 빈 장터',
        place: '한강',
        body: '맞은편에는 삼베를 팔 사람이, 이쪽에는 곡식을 내갈 사람이 있다. 두 마을은 각기 다른 날에 장을 열고 있다.',
        choices: [
          {
            intent: 'trade',
            label: '두 장날을 한날로 맞춘다',
            desc: '곡물을 들여 나루의 왕래를 돕는다.',
            delta: { grain: -5, trust: 3, trade: 11 },
            influence: 2,
            result:
              '동이 트기도 전에 나룻배 양쪽에 베 꾸러미와 곡식 섬이 쌓였다.',
          },
          {
            intent: 'council',
            label: '뱃사공들에게 날을 맡긴다',
            desc: '준비가 늦어져도 마을의 동의를 얻는다.',
            delta: { grain: -3, trust: 8, trade: 4 },
            influence: 1,
            result: '사공들은 물때에 맞춘 장날을 골랐다. 취소되는 배가 줄었다.',
          },
          {
            intent: 'reserve',
            label: '창고에서 곡식을 사들인다',
            desc: '비축량을 늘리고 민간 거래를 줄인다.',
            delta: { grain: 10, trust: 0, trade: -6 },
            influence: -1,
            result: '관아 창고로 들어간 곡식만큼 장터에서 오가던 짐이 줄었다.',
          },
        ],
      },
      {
        title: '누가 쓸 목재인가',
        place: '평양',
        body: '관아에 들어온 목재 한 묶음을 두고 창고지기와 나루의 목수가 기다린다. 마을 사람들이 모이는 집의 지붕도 비가 샌다.',
        choices: [
          {
            intent: 'reserve',
            label: '곡물 창고부터 고친다',
            desc: '노역을 들여 곡물 손실을 줄인다.',
            delta: { grain: 10, trust: -4, trade: 0 },
            influence: 0,
            result:
              '창고 바닥을 높였다. 비가 지난 뒤에도 아랫단 곡식이 마른 채 남았다.',
          },
          {
            intent: 'trade',
            label: '나룻배 수리에 보탠다',
            desc: '왕래가 빨라지고 부두 일이 늘어난다.',
            delta: { grain: -4, trust: 2, trade: 10 },
            influence: 1,
            result:
              '수리가 끝난 배가 다시 물에 뜨자 건너편 장터의 물건도 돌아왔다.',
          },
          {
            intent: 'relief',
            label: '마을의 새 지붕을 얹는다',
            desc: '공동 작업에 식량을 보탠다.',
            delta: { grain: -7, trust: 11, trade: 0 },
            influence: 2,
            result:
              '비가 쏟아지는 동안 마을 사람들은 처음으로 마른 회관에 모였다.',
          },
        ],
      },
    ],
    baekje: [
      {
        title: '웅진의 첫겨울',
        place: '웅진',
        body: '새 도읍에 입이 늘었다. 봄에 뿌릴 씨곡식까지 나누어 달라는 청이 궁궐에 들어왔다.',
        choices: [
          {
            intent: 'relief',
            label: '왕실 창고를 연다',
            desc: '당장 끼니를 나누고 씨곡식이 줄어든다.',
            delta: { grain: -10, trust: 12, trade: 0 },
            influence: 2,
            result:
              '아이를 업은 이들이 창고 앞에 줄을 섰다. 마지막 됫박에 이르러서야 긴 줄이 풀렸다.',
          },
          {
            intent: 'reserve',
            label: '씨곡식을 따로 봉한다',
            desc: '파종할 몫을 지키지만 오늘의 배급은 줄어든다.',
            delta: { grain: 8, trust: -7, trade: 0 },
            influence: -1,
            result:
              '항아리마다 씨곡식 표지가 달렸다. 저녁 배급을 받으러 온 사람들은 빈 그릇을 오래 들여다봤다.',
          },
          {
            intent: 'trade',
            label: '강나루에서 곡식을 들인다',
            desc: '교역에 쓰던 물자를 곡식과 바꾼다.',
            delta: { grain: 7, trust: 4, trade: -8 },
            influence: 1,
            result:
              '강을 건너온 곡식이 모자란 배급을 메웠다. 돌아가는 배에는 왕실의 베가 실렸다.',
          },
        ],
      },
      {
        title: '웅진에 모인 깃발',
        place: '웅진',
        body: '각 고을에서 온 이들이 새 도읍에 모였다. 군량을 수비대에 먼저 돌릴지, 백성의 봄 몫을 남길지 조정의 뜻을 묻는다.',
        choices: [
          {
            intent: 'defense',
            label: '수비대의 몫을 늘린다',
            desc: '비축을 덜어 접경의 영향력을 높인다.',
            delta: { grain: -8, trust: 3, trade: 0 },
            influence: 2,
            result:
              '웅진의 군량 장부에 새 몫이 적혔다. 주변 고을의 깃발들이 조정의 결정에 응했다.',
          },
          {
            intent: 'reserve',
            label: '봄을 위해 씨곡식을 남긴다',
            desc: '봄의 비축을 지키고 접경의 부담을 감수한다.',
            delta: { grain: 9, trust: 1, trade: -3 },
            influence: -1,
            result:
              '씨곡식 항아리에 봉인이 찍혔다. 접경에서 올라온 청은 다음 달로 미뤄졌다.',
          },
          {
            intent: 'trade',
            label: '이웃 고을에서 곡식을 들인다',
            desc: '교역 물자로 창고를 채운다.',
            delta: { grain: 6, trust: 2, trade: -7 },
            influence: 1,
            result:
              '강나루에 곡식 자루가 쌓였다. 물건을 내준 고을의 이름도 함께 장부에 올랐다.',
          },
        ],
      },
      {
        title: '나루의 첫 장날',
        place: '웅진',
        body: '강가에 장이 서자 세곡을 나르는 배와 물건을 파는 배가 같은 자리를 기다린다. 누가 먼저 닻을 내릴까?',
        choices: [
          {
            intent: 'trade',
            label: '장삿배에 먼저 자리를 낸다',
            desc: '장터를 키우고 창고 반입을 늦춘다.',
            delta: { grain: -6, trust: 2, trade: 12 },
            influence: 1,
            result:
              '어물과 베가 강가에 풀렸다. 세곡선은 물때를 한 번 더 기다렸다.',
          },
          {
            intent: 'reserve',
            label: '세곡부터 창고로 옮긴다',
            desc: '창고 비축을 앞당긴다.',
            delta: { grain: 11, trust: 0, trade: -7 },
            influence: 0,
            result:
              '창고지기가 빈 칸을 지웠다. 나룻배 몇 척은 장이 파할 무렵에야 짐을 내렸다.',
          },
          {
            intent: 'council',
            label: '사공과 장꾼이 순번을 짠다',
            desc: '일하는 이들에게 식량을 대고 순번을 정한다.',
            delta: { grain: -4, trust: 9, trade: 4 },
            influence: 2,
            result:
              '강변에 말뚝 세 개가 박혔다. 어느 자리에 배를 댈지 나루 사람들부터 알게 됐다.',
          },
        ],
      },
    ],
    silla: [
      {
        title: '서쪽에서 온 사절',
        place: '금성',
        body: '백제 사절의 수레가 금성에 들었다. 돌아갈 때 베 대신 곡식을 실어 달라는 청이다.',
        choices: [
          {
            intent: 'relief',
            label: '곡식을 선물한다',
            desc: '비축을 나눠 이웃의 신뢰를 얻는다.',
            delta: { grain: -10, trust: 5, trade: 6 },
            influence: 2,
            result:
              '사절은 수레를 끌기 전, 곡식을 보내준 고을의 이름부터 받아 적었다.',
          },
          {
            intent: 'trade',
            label: '베와 곡식을 맞바꾼다',
            desc: '곡식을 내고 다음 교역을 기약한다.',
            delta: { grain: -5, trust: 0, trade: 11 },
            influence: 1,
            result: '도읍의 가게에는 베가, 서쪽 길의 수레에는 곡식이 실렸다.',
          },
          {
            intent: 'reserve',
            label: '고을의 비축부터 채운다',
            desc: '창고를 채우고 교류를 미룬다.',
            delta: { grain: 8, trust: 3, trade: -8 },
            influence: -1,
            result: '금성의 창고에는 여유가 생겼다. 사절은 빈 수레로 돌아갔다.',
          },
        ],
      },
      {
        title: '두 고을의 물꼬',
        place: '낙동강',
        body: '윗마을은 논에 물을 더 대고 싶고 아랫마을은 물길이 마른다고 한다. 두 마을 대표가 같은 날 찾아왔다.',
        choices: [
          {
            intent: 'council',
            label: '두 마을이 날짜를 정한다',
            desc: '협의에 곡식을 보태고 신뢰를 얻는다.',
            delta: { grain: -4, trust: 11, trade: 0 },
            influence: 2,
            result: '마을마다 돌아오는 날에 물꼬를 여는 약속이 생겼다.',
          },
          {
            intent: 'reserve',
            label: '수확이 큰 논에 먼저 댄다',
            desc: '거둘 곡식이 늘고 일부 고을의 불만이 남는다.',
            delta: { grain: 12, trust: -9, trade: 0 },
            influence: -1,
            result:
              '큰 논의 벼는 고르게 자랐다. 물을 늦게 받은 집들이 관아 앞에 모였다.',
          },
          {
            intent: 'trade',
            label: '이웃 고을의 일손을 산다',
            desc: '교역 물자를 써서 물길을 보수한다.',
            delta: { grain: 7, trust: 5, trade: -8 },
            influence: 1,
            result:
              '일손이 더해져 막힌 물길이 열렸다. 일꾼들은 품삯으로 받은 베를 지고 떠났다.',
          },
        ],
      },
      {
        title: '대장간의 빈 자루',
        place: '금성',
        body: '새 낫을 기다리는 농가와 쇠붙이를 사 가려는 장꾼이 대장간에 모였다. 남은 숯은 두 주문을 모두 받기엔 모자란다.',
        choices: [
          {
            intent: 'reserve',
            label: '농가의 낫부터 벼린다',
            desc: '수확을 돕고 장터 주문을 미룬다.',
            delta: { grain: 9, trust: 4, trade: -7 },
            influence: 1,
            result:
              '낫을 든 사람들이 해 지기 전에 논으로 돌아갔다. 장꾼은 다음 장날을 기약했다.',
          },
          {
            intent: 'trade',
            label: '장꾼과 숯을 맞바꾼다',
            desc: '처음 들여올 몫을 대고 거래를 넓힌다.',
            delta: { grain: -6, trust: 0, trade: 11 },
            influence: 1,
            result:
              '돌아온 장꾼의 수레에 숯자루가 실려 있었다. 대장간은 이틀 더 불을 밝혔다.',
          },
          {
            intent: 'council',
            label: '고을마다 차례를 정한다',
            desc: '조금 늦어져도 여러 고을에 낫을 돌린다.',
            delta: { grain: -4, trust: 10, trade: 3 },
            influence: 2,
            result:
              '농가들은 낫을 쓸 날을 미리 알게 됐다. 빈손으로 두 번 찾아올 집이 줄었다.',
          },
        ],
      },
    ],
  },
  sources: [
    {
      label: '국사편찬위원회 · 475년 한성 함락과 웅진 천도',
      url: 'https://contents.history.go.kr/front/hm/view.do?levelId=hm_009_0050',
    },
    {
      label: '국사편찬위원회 · 한성 함락과 신라의 구원 기록',
      url: 'https://contents.history.go.kr/front/kc/printViewPopup.do?levelId=kc_n100050',
    },
    {
      label: '국사편찬위원회 · 고대의 농업과 농기구',
      url: 'https://contents.history.go.kr/data/pdf/km/km_027.pdf',
    },
    {
      label: '국립중앙박물관 · 고구려 기병과 말갖춤',
      url: 'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendId=450616&schM=view',
    },
    {
      label: '국립중앙박물관 · 삼국시대 철제 갑옷',
      url: 'https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?pageSize=10&relicRecommendId=16925&sc=COM.RELIC_NAME&schM=view',
    },
    {
      label: '한성백제박물관 · 한성백제의 철기 문화',
      url: 'https://baekjemuseum.seoul.go.kr/module/index.jsp?boardid=a&code=DP&mmode=content&mpid=SEM0204000000&pid=21625',
    },
  ],
};
