const BaseController = require("./BaseController");
const Project = require('../../models/Project');
const Result = require('../../models/Results');
const MonthlySearch = require("../../models/MonthlySearch");


class ProjectController extends BaseController {
    static async create (req, res) {
        try {
            const {name, description, url, selectedCountry , selectedLanguage, locationCode} = req.body;
            if(!name, !selectedCountry, !selectedLanguage) {
                return res.status(401).json({error: 'Missing fields name or locationCode or language'});
            }
            const newProject = await Project.create({
                name,
                description,
                userId : req.user.id,
                url,
                locationCode : selectedCountry?.code || locationCode,
                selectedLanguage,
            });
            if(newProject === null){
                return res.json({error : "Failed to create projecr"});
            }
            return res.status(201).json(newProject);
        }catch(err){
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
    }
    
    static async update (req, res)  {
        const {id} = req.params;
        const {name, description, selectedLanguage, locationCode, selectedCountry} = req.body;
        const project = await Project.findByPk(id);
        if(project === null) {
            return res.status(404).json({error : 'project not found'});
        }
        if(!name && !description){
            return res.status(401).json({error: 'name or description are required'});        
        }
        project.name = name;
        project.description = description;
        project.selectedLanguage = selectedLanguage,
        project.locationCode = locationCode || selectedCountry.code;
        await project.save();
        console.log(project);
        return res.json({message : "Done the project has been updated!"})
    }
    
    static async delete (req, res)  {
        const {id} =  req.params;
        const project = await Project.findByPk(id);
        if(project === null) {
            return res.status(404).json({error : 'project not found'});
        }
        const results = await Result.findAll({where : {ProjectId : project.id}});
        for (const result of results){
            await result.destroy();
        }
        await project.destroy();
        res.status(204).json({});
    }
    
    
    static async showProjectResults (req, res) {
        const {id} =  req.params;
        const project = await Project.findByPk(id);
        if (project === null){
            return res.status(401).json({error : "Project not found"});
        }
        const results = await Result.findAll({where : {ProjectId: id}});
        let newRes = []

        for (const result of results){
            if(!result.parent_id){
                result.dataValues.suggestions = [];
                const monthlySearches = await MonthlySearch.findAll({where : {
                    ResultId : result.id
                }})
                result.dataValues.monthlySearch = monthlySearches;
                newRes.push(result);
            }else{
                const parent = newRes.find(r => r.id === result.parent_id);
                if (parent) {
                    parent.dataValues.suggestions.push(result);
                }
            }
        }
        return res.json(newRes);
    }
    
    
    static async showProjects(req, res) {
        const {id} = req.user;
        const page =  parseInt(req.query?.page)|| 0 ;
        const pageSize = parseInt(req.query?.pageSize) || 20; 
        const offset = page > 0 ? page * pageSize : page;
        const limit = pageSize;
        const projetcs = await Project.findAll({where : {userId : id}, offset, limit});
        return res.status(200).json(projetcs); 
    }
    
}




module.exports = ProjectController;


