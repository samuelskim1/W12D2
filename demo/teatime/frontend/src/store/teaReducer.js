import { requestTeas, postTea, requestTea} from "../utils/tea_api_utils";

const RECEIVE_TEA = 'RECEIVE_TEA';
const RECEIVE_TEAS = 'RECEIVE_TEAS';
const REMOVE_TEA = 'REMOVE_TEA';
export const RECEIVE_TEA_DETAIL = 'RECEIVE_TEA_DETAIL';

/* ------- prebuilt selectors --------- */
export const selectTea = (teaId) => state => state.teas[teaId];


/* ----ACTION CREATORS---- */

export const receiveTea = tea => {
  return {
    type: RECEIVE_TEA,
    tea
  }
};

export const receiveTeas = teas => {
  return {
    type: RECEIVE_TEAS,
    teas
  }
};

export const receiveTeaDetail = payload => {
  return {
    type: RECEIVE_TEA_DETAIL,
    payload
  };
};

export const removeTea = teaId => ({
  type: REMOVE_TEA,
  teaId
});


/* ----THUNK ACTION CREATORS---- */
export const fetchAllTeas = function() {
  // debugger;
  return async (dispatch) => {
    // dispatch({type: "Bogus"});
    const res = await requestTeas();
    const data = await res.json();
    // debugger;
    dispatch(receiveTeas(data));
  };
} 

export const createTea = (tea) => async (dispatch) => {
  const res = await postTea(tea);
  const data = await res.json();
  dispatch(receiveTea(data));
};

export const fetchTea = (teaId) => async (dispatch) => {
  const res = await requestTea(teaId);
  const data = await res.json();
  dispatch(receiveTeaDetail(data));
};

/* ----REDUCER---- */
const teaReducer = (state = {}, action) => {
  Object.freeze(state);
  const nextState = { ...state };

  switch (action.type) {
    case RECEIVE_TEA:
      nextState[action.tea.id] = action.tea;
      return nextState;
    case RECEIVE_TEA_DETAIL:
      nextState[action.payload.tea.id] = action.payload.tea;
      return nextState;
    case RECEIVE_TEAS:
      return { ...nextState, ...action.teas };
    case REMOVE_TEA:
      delete nextState[action.teaId];
      return nextState;
    default:
      return nextState;
  };
};

export default teaReducer;
// daily bread