import { RECEIVE_TEA_DETAIL } from "./teaReducer";

export const transactionSelector = (teaTransactionIds) => (state) => {
    let ids = [];
    if (teaTransactionIds) ids = teaTransactionIds;
    return ids.map(id => state.transactions[id]);
  };

const transactionReducer = (state={}, action) => {
    Object.freeze(state);
    const nextState = {...state};
    switch(action.type){
        case RECEIVE_TEA_DETAIL:
            return {...nextState, ...action.payload.transactions}
        default:
            return nextState;
    }


}

export default transactionReducer;