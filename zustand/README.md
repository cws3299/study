# Zustand

### 1. Zustand 스토어 구조 설계

- 상태 (State)
- 액션 (Action)
- 계산된 값 (Computed Value)



```javascript
const useAppStore = create((get, set) => ({
    count: 0,
    increment: () => set(state => ({count: state.count + 1})),
    doubleCOunt: () => get().count * 2
}))
```

> 역할 명확히 하기
>
> 예전에 작업할때는 computed Value를 딱히 쓸 일이 없어서 안썼었음



### 2. 상태 선택 패턴 (Selector)

-  필요한 값만 선택적으로 가져오기 (완전 처음 공부했을 때, 실제 업무에서 적용 했을 때, 이걸 잘 몰라서 최적화가 안됬던 적)

- ```javascript
  const name = useUserStore(state => state.user.name);
  
  // state => state.user.name (selector 함수)
  ```

- ```javascript
  const isLoggedIn = useUserStore(state => state.user.isLoggedIn)
  ```

  - 사용하는 값만 store에서 가져와 구독

- selector함수는 컴포넌트 바깥에서 선언해서 재사용하기

  - ```jsx
    function MyComponent() {
      const count = useStore((state) => state.count);
        // ⛔️ 매 렌더마다 새로운 함수가 만들어짐
        // 컴포넌트 리렌더링마다 새로 불러옴
      ...
    }
    ```

  - ```js
    // selector.ts
    export const selectCount = (state) => state.count;
    ```

  - ```jsx
    import { selectCount } from './selector';
    
    function MyComponent() {
      const count = useStore(selectCount); // ✅ 항상 같은 함수 참조
      ...
    }
    ```

- useShallow 활용

  - zustand는 기본적으로 selector함수의 반환값이 변경되면 리렌더링을 실행함

    - 아래와 같이 실행하면, 매번 다른 객체를 반환하므로, 컴포넌트 리렌더링

    - ```txt
      const obj = useStore((state) => ({ isLoggedIn: state.isLoggedIn,
        username: state.username, })); 
      ```

    - ```txt
      const { isLoggedIn, username } = useShallow(useAuthStore)((state) => ({
        isLoggedIn: state.isLoggedIn,
        username: state.username,
      }));
      
      // useShallow로 작업하면, 전체 참조값은 바뀌어도 내부가 변경안되었기 때문에, 리렌더링 X
      ```

      - 참고로 isLoggedIn이나 username이 하나만 너무 자주 바뀌면 따로 각각 불러서 사용하기
      - 그래도 너무 자주 사용하는 것만 아니면 위처럼 묶어서 가져오면, 객체 값 대응이 편함
      - props로 넘겨도 됨 -> 하위 컴포넌트가 단순한 위젯형 컴포넌트면, 거기서 zustand가져오는 것보다 의존성 주입을 위해 props로 넘기는게 나을거 같기도?
        - `이건 생각 많이 안해봤는데, 예전에 본 강의랑 책 다시보고 래퍼런스도 찾아보면서 생각해보니 이게 유용한거 같음`





### 3. 상태 업데이트

`set()` 으로 상태를 변경

`get()`으로 현재 상태를 조회

```js
setCount: (value) => set({count: value});
increment: () => set(state => ({count: state.count + 1}))
doubleCount: () => get().count * 2
```

> 객체 데이터의 불변성을 지키기위해, set, get으로 수정이 필수
>
> 다 알듯이 당연히, useState등과 동일, 참조값 기반으로 새로 등록 
>
> copyOnWrite 느낌



### 4. 복잡한 상태 구조 다루기

```js
updatePersonalInfo: (newInfo) => set(state => ({
    profile: {
        ...state.profile,
        personal: {
            ...state.profile.personal,
            ...newInfo
        }
    }
}))

addTask: (task) => set(state => ({
    tasks: [...state.taskes, task]
}))

removeTask: (task) => set(state => ({
    tasks: state.tasks.filter(item.id !== task.id)
}))
```

> copyOnWrite
>
> 리액트는 상태 변경을 얕은 비교로 확인함





----

## Zustand 액션 설계

✔️ 액션은 매개변수를 받아야 한다

```js
addTodo: (text) => ((state) => ({
     todos: [...state.todos, {text, completed: false}]
}))
```

- 필요한 정보는 항상 외부에서 받아야 함

- 내부에서 무작정 생성 ❌  => 예측 불가, 테스트 어려움

  > 매개 변수 없는 액션은 유지보수에 매우 좋지 않음



✔️ 액션 하나로 여러 상태를 동시에 변경하기

```js
loginSuccess: (userInfo) => ((set) => ({
    isLoggedIn: true,
    userInfo,
    error: null
}))
```

- 관련된 상태는 하나의 액션 안에서 처리

- 로직이 흩어지지 않아 코드가 명확해짐

  > 관련된 상태는 하나로 묶는것도 중요하지만, 액션과 거기에 밀접한 상태를 잘 나눠놓는게 좋을듯?



✔️ 액션은 상태 변경에만 초점 - 비즈니스 로직과 분리



✔️ 액션 그룹화 하기

```js
const useStore = create((set) => ({
    user: {name: '', isLoggedIn: false},
    posts: [],
    
    userActions: {
        login: (name) => set({user: {name, isLoggedIn: true}})
        logout: () => set({user: {name: '', isLoggedIn: false}})
    }
    
    postActions: {
        addPost: (text) => set((state) => ({
            posts: [...state.posts, {text}]
        }))
    }
}))
```

- 기능별로 액션을 분리
- `useStore.getState().userActions.login('이름')`



----

## 비동기 패턴

✔️ 1. 스토어 내부에 비동기 함수 정의

```js
import create from 'zustand'

const useStore = create((set) => ({
    users: [],
    loading: false,
    error: null,
    fetchUsers: async() => {
        set({loading: true, error: null});
        try {
            const response = await fetch('https://api~~');
            const users = await response.json();
        } catch(error) {
            set({error: error.message, loading: false})
        }
    }
}))
```

> `useStore().fetchUsers()`
>
> - 상태 관련 로직이 한 곳에 집중되었으며, zustand내에 캡슐화됨



✔️ 2. 외부에서 호출, 내부에서 상태만 관리

```js
// store.js
const useStore = create((set) => ({
	users: [],
    isLoading: false,
    error: null,
    setUsers: (user) => set({users}),
    setLoading: (loading) => set({isLoading}),
    setError: (error) => set({error})
}))

// api.js
export const fetchUsers = async() => {
    const {setUsers, setLoading, setError} = useStore.getStore();
    setLoading(true);
    setError(null);
    
    try {
        const response = await fetch('url');
        const users = await response.json();
        setUsers(users);
    } catch (error) {
        setError(error.message)
    } finally {
        setIsLoading(false)
    }
}
```

> - 당연히도 이 방식이 나음  => store는 단순히 상태, 액션 관리에 중심
>
> Spotify에서 token을 사용 중인데
>
> hook -> api 호출 -> api내에서 zustand 변경 -> 스포티파이 공식문서에 따른 redirect 이런식으로 하는게 편할듯



---

Zustand + Flux 패턴



- Flux
  - 모든 상태 변화는 단방향으로 흐른다
  - 액션 ➡️디스패처 ➡️스토어➡️상태변경➡️뷰 업데이트
  - `다만 리액트 18이상부터는 이벤트에 따라 특정 이벤트는 마이크로 태스크, 특정이벤트는 매크로 태스크에서 실행, 렌더레인등에 따라 다르지만, 그건 일단 미뤄두고 기본적으로는 위 순서`
  - `뷰` ➡️`액션` ➡️`디스패처` ➡️`스토어` ➡️`뷰`
    - Flux패턴에서는 모든 액션은 반드시 디스패처를 통해 스토어에 전달 됨



- zustand는 flux는 아니고 구독패턴이지만 flux패턴과 비슷한  철학이 많음

  - 1️⃣. 단일 스토어 구조를 유지

    - 전역상태를 하나에 스토어에 모으되, 규모가 커지면 slice로 분리

      - ```js
        const useStore = create((set) =>  ({
            userSlice: {...},
            postSlice: {...},
            reviewSlice: {...}
        }))
        ```

  - 2️⃣. 항상  set으로 상태 업데이트

    - 오직 허락된 인터페이스는 set임

    - `set((state) => ...)`

      - ```js
        increase: () => set((state) => ({
            count: state.count + 1
        }))
        ```

  - 3️⃣. 액션은 스토어에 함께 정의

    - ```js
      const useStore = create((set) => ({
          count: 0,
          user: null,
          setUser: (user) => set({ user }),
          increase: () => set((state) => ({count: state.count + 1})),
          decrease: () => set((state) => ({count: state.count - 1}))
      }))
      ```



---

## Slice 패턴

- 장바구니 Slice

  - ```js
    export const createCartSlice = (set) => ({
        cartItems: [],
        addItem: (item) => set((state) => ({cartItems: [...state.cartItems, item])),
       removeItem: (itemId) => set((state) => ({cartItems: state.cartItems.filter((i) => i.id !== itemId)}))
    })
    ```

- 사용자 slice

  - ```js
    export const createUserSlice = (set) => ({
        user: null,
        login: (userInfo) => set(() => ({uset: userInfo})),
        logout: () => set(() => ({user: null}))
    })
    ```

    

- slice간 상호작용

  - ```js
    export const createCombinedActionSlice = (set, get) => ({
        loginAndAddItem: (userInfo, item) => {
            get().login(userInfo);
            get().addItem(item)
        }
    })
    ```

    - > get()을 통해서 다른 slice 호출 가능

  

- slice 합치기 

  - ```js
    import {create} from 'zustand';
    
    export const useBoundStore = create((...a) => ({
        ...createCartSlice(...a),
        ...createUserSlice(...a)
        ...createCombinedActionSlice(...a)
    }))
    ```



- 미들 웨어 적용하기

  - ```js
    import { persist } from 'zustand/middleware';
    
    export const useBoundStore = create(
    	persist(
        	(...a) => ({
               ...createCartSlice(...a),
        	   ...createUserSlice(...a)
            }),
            {name: 'bound-store'}
        )
    )
    ```

    > middleware는 반드시 합친 곳에서 적용
    >
    > persist의 첫번째 인자 -> 기존 create의 인자, 두번째 인자  store name관련 객체



---

## Persist

```js
import { create } from 'zustand';
import { persit } from 'zustand/middleware';

type PositionStore = {
    position: {x: number, y: number},
    setPosition: (position: {x:number, y:number}) => void
}

export const usePositioStore = create<PositionStore>() (
	persist(
    	(set) => ({
            position: {x: 0, y:0},
            setPosition: (position => set({position}))
        }),
        {name: 'position-storage'}
    )
)
```



### 상태 일부만 저장

```js
import { create } from 'zustand';
import { persit } from 'zustand/middleware';

type PositionStore = {
    context: {position: {x: number, y: number}},
    setPosition: (position: {x:number, y:number}) => void
}

export const usePositioStore = create<PositionStore>() (
	persist(
    	(set) => ({
            context: {position: {x: 0, y:0 }},
            setPosition: (position => set({context: position}))
        }),
        {
            name: 'position-storage',
        	partialize: (state) => ({context: {position: state.context. position}})
        },
        
    )
)

// 상태에 context외에 다른 값이 있을 때 pertialize를 활용하여 context만 저장
```



### 커스텀 스토리지 (URL 파라미터)

```js
const searchParamsStorage = {
    getItem: (key) => new URLSearchParams(location.search).get(key),
    setItem: (key, value) => {
        const params = new URLSearchParams(location.search)
        params.set(key, value)
        window.history.replaceState({}, '', '?' + params.toString()) // 페이지 새로고침없이 변경
    },
    removeItem: (key) => {
        const params = new URLSearchParams(location.search)
        params.delete(key)
        window.history.replaceState({}, '', '?' + params.toString())
    }
}
```

```js
const positionStore = create<PositionStore>() {
    persist(
    	(set) => ({
            position: {x: 0, y: 0}, 
            setPosition: (position) => set({position})
        }),
        {
        	name: 'position-storage',
        	storagae: createJSONStorage(() => searchParamsStorage)
    	}
    ),
}
```

> 로컬 스토리지가 아닌 URL  Query 파라미터를 저장소로 활용

> 당연히 전역공유가 아닌 사용자 브라우저마다 공유



## 수동 하이드레이션

- 저장된 상태를 불러와, 앱에 다시 주입 -> Next.js의 ssr 페이지의 경우 localStorage등을 사용 못함

- 클라이언트 컴포넌트로 전환 후, hydration 해줘야함

  - 스포티파이 - Next 프로젝트 진행 당시, 백엔드 없이 프론트엔드만으로 OAuth  처리와 앱라우터등을 한번에 사용하려하니 토큰 관련 문제가 발생했었던 사례 존재

  ```js
  const positionStore = create<PositionStore>() (
  	persist(
      	(set) => ({
              position: {x: 0, y:0},
              setPosition: (position) => set({ position }),
          }),
          {
              name: 'position-storage',
              skipHydration: true.
          }
      )
  )
  
  setTimeout(() => {
      positionStore.persist.rehydrate() // 서버 사이드 렌더링 활용 시, 클라이언트 전환 후 복원하는게 중요함
  }, 2000)
  ```

  

---

### Immer

- zustand + immer

  - ```js
    import produce from 'immer';
    
    const nextState = produce(baseState, (draft) => {
        draft.users['1'].age = 31
    })
    ```

    - draft는 프록시 객체 -> 원본은 변하지 않고 새로운 불변 객체를 생성
      - `Proxy`는 ES6에서 도입된 기능으로, **객체에 대한 접근(get/set 등)을 가로채서 제어할 수 있는 래퍼**
      - 1. `baseState`를 `Proxy`로 감쌈 → `draft`가 됨
        2. `draft`를 수정함 → Immer가 어떤 프로퍼티가 바뀌었는지 추적
        3. `produce()` 종료 시점
           - 변경된 부분만 새 객체로 복사 (Copy-on-Write)
           - 나머지는 기존 참조 재사용 (얕은 복사)

  - ```js
    import { create } from 'zustand';;
    import { immer } from 'zustand/middleware/immer';
    
    const useUserStore = create(
    	immer((set) => ({
            users: {
                '1': {
                    name: '꼬부기',
                    profile: {
                        address: {city:'서울', district: '태초마을'}
                    }.
                }
            },
            updateDistrict: (userId, district) => set(
                (state) => {
                    state.users[userId].profile.address.district = district
                }
            )
        }))
    )
    
    // 사용
    const {users, updateDistrict} = useUserStore();
    const user = users['1']
    
    updateDistrict('1', ~~)
    ```

    > immer + zustand
    >
    > 사실 reactQuery 사용하면 위 사례는 거의 마주칠 일 없음



- 불변성이 중요한 이유
  - 리액트는 최상단 데이터 객체의 참조 주소 기반으로 데이터 변화 유무 확인
    - spread -> CopyOnWrite로 새로운 객체 반환하여, 최상단 참조 주소 변환
    - 다만 내부의 경우 모든 데이터 재생성의 경우 비효율적 -> 기존에 존재하던 내부 데이터는 얕은 참조 형태로 가져옴
    - 변경하려는 값만 변경
  - 코드의 예측 가능성이 향상됨
  - 디버깅 / 타임머신 기능
  - 동시성 문제 감소



### 궁금증 

- 객체의 값을 계속 변경해도 특정 키의 경우 초기값이 현재도 유지되면 GC가 되나?
  - "내부의 값이 같더라도, 최상단 객체의 참조가 끊기면 GC 대상이 됨
    - 참조가 다르면 (최상단 객체가 새로 만들어졌고, 이전 것을 아무도 가리키지 않으면)  → 내부 값이 같든 말든 **그 이전 객체 전체는 가비지 컬렉터 대상**
