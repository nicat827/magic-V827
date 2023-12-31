const PromoModel = require("../models/promo-model");
const PromoActivatedModel = require("../models/activated-promo-model");
const PromoDto = require('../dtos/promo-dto');
const PromoActivateDto = require('../dtos/user-avctivate-promo-dto');
const ApiError = require('../exceptions/api-error');
const VkModel = require('../models/vk-model');
const MinesModel = require('../models/mines-model');

class MinesService {

    async start(amount, countMines, id) {
        
        const user = await VkModel.findOne({id})
        const game = await MinesModel.findOne({id, status:'active'})
        if (game) {
            throw ApiError.BadRequest('Игра уже началась!')
        }
        if (!user) {
            throw ApiError.BadRequest('Пользователь не существует!')
        } 
       
        let mines = []
        
        while (countMines !== 0) {
            const randomNum = Math.floor(Math.random() * 26)
            if (!mines.includes(randomNum) && randomNum !== 0) {
                mines.push(randomNum)
                countMines -= 1
            }
        }
        console.log(amount)
        const createGame = await MinesModel.create({id, mines, amount, click:[], status:"active", win: amount})
        user.balance = user.balance - Number(amount)
        await user.save();
        const returnValue = {
            balance: user.balance.toFixed(2),
            status: createGame.status,
            click: createGame.click,
            amount: createGame.amount,
            count: createGame.mines.length
        }
        return returnValue;

    }

    async check(id) {
        console.log(id)
        const game = await MinesModel.findOne({id, status:'active'})
        console.log(game)
        if (game) {
            
            const returnValue = {
                click: game.click,
                amount : game.amount,
                status : game.status,
                win : game.win,
                count: game.mines.length
            

            }
            return returnValue;
        }
    }

    async click(position, id) {
        const game = await MinesModel.findOne({id, status:'active'})
        
        if (!game) {
            throw ApiError.BadRequest('Сессия не найдена!')
        }

        if (game.mines.includes(position) && !game.click.includes(position)) {
            const user = await VkModel.findOne({id})
            game.status = 'lose';
            game.win = 0
            game.click.push(position)
            user.mines.push({id:game._id, amount:game.amount, status:game.status})
            await user.save()
            await game.save();
            return game;

        }

        else if (!game.mines.includes(position) && !game.click.includes(position)) {
            game.click.push(position)
            await game.save();
            const returnValue = {
                click: game.click,
                id: position,
                status: game.status
            }
            return returnValue;
        }
 
        
        
    }

    async get(id) {
        
        const game = await MinesModel.findOne({_id:id})
        if (!game) {
            throw ApiError.BadRequest('Игра не найдена!')
        }
        
        return game;
    }

    async end(win, id) {
        const user = await VkModel.findOne({id})
        const game = await MinesModel.findOne({id, status:'active'})
        console.log(game)
        if (!game) {
            throw ApiError.BadRequest('Сессия не найдена!')
        }
                 
        if (!user) {
            throw new ApiError.BadRequest('Пользователь не существует!')
        }
       
        
        
        console.log(win)
        
        if (win > 0) {
            game.status = 'win'
            game.win = win
            user.balance = user.balance + win
            user.mines.push({id:game._id, amount:game.amount, status:game.status, win: game.win})
        
            await user.save()
            await game.save()
            const returnValue = {
                balance : (Number(user.balance.toFixed(2))),
                game
            } 
            return returnValue;
        }

        
    }
}

    


module.exports = new MinesService();