import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectTea, fetchTea } from '../store/teaReducer';
import { transactionSelector } from "../store/transactionReducer";

const TeaDetail = ({ teaId }) => {
  // state = {
  //   teas: {
  //     1: {},
  //     2: {}
  //   },
  //   transactions: {
  //     1: {},
  //     2: {},
  //     3: {}
  //   }
  // };
  const dispatch = useDispatch();
  const tea = useSelector(selectTea(teaId));
  // const transactions = useSelector(state => Object.values(state.transactions));
  const transactions = useSelector(transactionSelector(tea.transactionIds));

  useEffect(() => {
    // make request to fetch tea information
    dispatch(fetchTea(teaId));
  }, []);


  return (
    <div className="tea-detail">
      {/* add tea description */}
      <h4>{tea.description}</h4>
      <p>Transactions</p>
      {/* <div>To be completed</div> */}
      <ul>
        {transactions.map(transaction => {
          return (
            <li className="transaction" key={transaction.id}>
              <p>Customer: {transaction.customer}</p>
              <p>Quantity: {transaction.quantity}</p>
              <p>Total: ${transaction.quantity * tea.price}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default TeaDetail;