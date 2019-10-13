#!/usr/bin/env ruby

# frozen_string_literal: true

require 'cinch'

bot = Cinch::Bot.new do
  configure do |c|
    c.nick = 'M_CINCH'
    c.server = 'irc.root-me.org'
    c.channels = ['#root-me_challenge']
  end

  on :connect do |_m|
    User('Candy').send('!ep2')
  end

  on :private do |m|
    m.reply('!ep2 -rep ' + Base64.decode64(m.message))
  end
end

bot.start
