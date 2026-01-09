module.exports.error_handle = (searchData) => {
    if(searchData?.errors?.length) searchData.message = searchData?.errors[0]?.message;
    if(typeof searchData?.detalhes === "object" ) { searchData.message = searchData?.detalhes[0]; }
    if(searchData?.detalhes) searchData.message = searchData?.detalhes;
    if(searchData?.logEntryId) { searchData.message = "An internal error has occurred"; }
    if(searchData?.details?.length) searchData.message = searchData?.details[0];
    if(searchData?.error?.message) searchData.message = searchData?.error?.message;
    if(searchData?.erros?.[0]?.descricao) { 
        searchData.message = searchData?.erros?.[0]?.descricao; 
    }
    return searchData;
};
