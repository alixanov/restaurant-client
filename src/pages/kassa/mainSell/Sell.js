export const handleEnter = ({
  input,
  inputBarcode,
  setInput,
  setInputBarcode,
  mahsulotlar,
  cart,
  setCart,
}) => {
  const inputParts = input.match(/^(\d+)([\+\-\*\/]?)(\d*)$/);
  const inputValue = inputBarcode?.trim();
  const plusIndex = inputValue.indexOf("+");

  if (inputParts) {
    const index = parseInt(inputParts[1], 10) - 1;
    const operation = inputParts[2];
    const value = parseInt(inputParts[3], 10);

    if (!isNaN(index) && index >= 0) {
      setCart((prevCart) => {
        if (index >= 0 && index < prevCart?.length) {
          const item = prevCart[index];
          let newQuantity = item.quantity;

          if (operation === "+") {
            newQuantity += value || 1;
          } else if (operation === "*") {
            newQuantity *= value || 1;
          } else if (operation === "-") {
            newQuantity -= value || 1;
            newQuantity = newQuantity > 0 ? newQuantity : 0;
          } else if (!operation && !isNaN(value)) {
            newQuantity = value;
          }

          const updatedCart = prevCart.map((cartItem, i) =>
            i === index ? { ...cartItem, quantity: newQuantity } : cartItem
          );

          return updatedCart.filter((item) => item.quantity > 0);
        }

        return prevCart;
      });

      setInput("");
    }
  } else if (plusIndex !== -1) {
    const barcode = inputValue.slice(0, plusIndex);
    const additionalQuantity = parseInt(inputValue.slice(plusIndex + 1), 10);

    const foundProduct = Array.isArray(mahsulotlar)
      ? mahsulotlar.find((product) => product.barcode === barcode)
      : null;

    if (foundProduct) {
      const existingProduct = cart?.find((item) => item.barcode === barcode);
      if (existingProduct) {
        setCart(
          cart?.map((item) =>
            item.barcode === barcode
              ? { ...item, quantity: item.quantity + additionalQuantity }
              : item
          )
        );
      } else {
        setCart([...cart, { ...foundProduct, quantity: additionalQuantity }]);
      }
    }
  } else {
    const foundProduct = Array.isArray(mahsulotlar)
      ? mahsulotlar.find((product) => product.barcode === inputValue)
      : null;
    if (foundProduct) {
      const existingProduct = cart?.find((item) => item.barcode === inputValue);
      if (existingProduct) {
        setCart(
          cart?.map((item) =>
            item.barcode === inputValue
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setCart([...cart, { ...foundProduct, quantity: 1 }]);
      }
    }
  }

  setInput(""); // input maydonini tozalash
  setInputBarcode(""); // inputBarcode maydonini tozalash
};

// export const handleEnter = ({ input, inputBarcode, setInput, setInputBarcode, mahsulotlar, cart, setCart }) => {
//     const inputParts = input.match(/^(\d+)([\+\-\*\/]?)(\d*)$/);
//     const inputValue = inputBarcode?.trim();
//     const plusIndex = inputValue.indexOf('+');

//     if (inputParts) {
//         const index = parseInt(inputParts[1], 10) - 1;
//         const operation = inputParts[2];
//         const value = parseInt(inputParts[3], 10);

//         if (!isNaN(index) && index >= 0) {
//             setCart(prevCart => {
//                 if (index >= 0 && index < prevCart?.length) {
//                     const item = prevCart[index];
//                     let newQuantity = item.quantity;

//                     if (operation === '+') {
//                         newQuantity += value || 1;
//                     } else if (operation === '*') {
//                         newQuantity *= value || 1;
//                     } else if (operation === '-') {
//                         newQuantity -= value || 1;
//                         newQuantity = newQuantity > 0 ? newQuantity : 0;
//                     } else if (!operation && !isNaN(value)) {
//                         newQuantity = value;
//                     }

//                     const updatedCart = prevCart.map((cartItem, i) =>
//                         i === index ? { ...cartItem, quantity: newQuantity } : cartItem
//                     );

//                     return updatedCart.filter(item => item.quantity > 0);
//                 }

//                 return prevCart;
//             });

//             setInput('');
//         }
//     } else if (plusIndex !== -1) {
//         const barcode = inputValue.slice(0, plusIndex);
//         const additionalQuantity = parseInt(inputValue.slice(plusIndex + 1), 10);

//         const foundProduct = mahsulotlar?.find(product => product.barcode === barcode);

//         if (foundProduct) {
//             const existingProduct = cart?.find(item => item.barcode === barcode);
//             if (existingProduct) {
//                 setCart(cart?.map(item =>
//                     item.barcode === barcode ? { ...item, quantity: item.quantity + additionalQuantity } : item
//                 ));
//             } else {
//                 setCart([...cart, { ...foundProduct, quantity: additionalQuantity }]);
//             }
//         }
//     } else {
//         const foundProduct = mahsulotlar?.find(product => product.barcode === inputValue);
//         if (foundProduct) {
//             const existingProduct = cart?.find(item => item.barcode === inputValue);
//             if (existingProduct) {
//                 setCart(cart?.map(item =>
//                     item.barcode === inputValue ? { ...item, quantity: item.quantity + 1 } : item
//                 ));
//             } else {
//                 setCart([...cart, { ...foundProduct, quantity: 1 }]);
//             }
//         }
//     }

//     setInput(""); // input maydonini tozalash
//     setInputBarcode(""); // inputBarcode maydonini tozalash
// };
