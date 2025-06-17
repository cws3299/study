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
> 불필요한 메모리 사용량을 줄이기위해, 기존 참조는 유지하고 (클로저 + 스코프), 변경되는 값만 변경하는 새로운 값 반환
>
> 리액트는 상태 변경을 얕은 비교로 확인함



