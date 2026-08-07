class Pagination{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'limit', 'sort'];
        excludedFields.forEach(el => delete queryObj[el]);

        this.query = this.query.find(queryObj);
        return this;
    }

    sort(defaultSort = '-createdAt'){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }
        else{
            this.query = this.query.sort(defaultSort)
        }
        return this;
    }

    search(searchableFields = ['displayName', 'slug']){
        if(this.queryString.search){
            const keyword = this.queryString.search.trim();

            const searchCondition = searchableFields.map(field => ({
                [field]: {$regex: keyword, $options: 'i'}
            }));

            this.query = this.query.find({$or: searchConditions});
        }
        return this;
    }

    paginate(){
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    getPaginationMeta(totalDocuments){
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        return {
            total: totalDocuments,
            page,
            limit,
            totalPages: Math.ceil(totalDocuments / limit)
        };
    }
}

module.exports = Pagination;