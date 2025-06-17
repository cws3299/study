import useAppStore from "./store/useAppStore";

function App() {
  // const count = useAppStore((state) => state.count);
  // const increment = useAppStore((state) => state.increment);

  const { count, increment } = useAppStore();

  return (
    <div>
      <div>zustand</div>
      <p>{count}</p>
      {/* <button onClick={() => increment()}>increment</button> */}
      <button onClick={increment}>increment</button>
    </div>
  );
}

export default App;
